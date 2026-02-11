import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Download,
    Filter,
    TrendingUp,
    Wallet,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// Import payment method logos
import expressLogo from "@/assets/express.png";
import multicaixaLogo from "@/assets/multicaixa.png";

interface Transaction {
    id: string;
    customer_name: string;
    customer_email: string;
    amount_cents: number;
    status: 'paid' | 'completed' | 'pending' | 'failed' | 'canceled';
    payment_method: 'multicaixa' | 'reference';
    reference_code?: string;
    created_at: string;
    paid_at?: string;
}

export default function FinancePage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [methodFilter, setMethodFilter] = useState<string>("all");

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('payments')
                .select('*')
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            if (methodFilter !== 'all') {
                query = query.eq('payment_method', methodFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setTransactions(data || []);
        } catch (error: any) {
            toast.error('Erro ao carregar transações: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [statusFilter, methodFilter]);

    // Client-side search (Supabase search is limited without Full Text Search setup)
    const filteredTransactions = transactions.filter(txn => {
        const searchLower = searchTerm.toLowerCase();
        return (
            txn.customer_name?.toLowerCase().includes(searchLower) ||
            txn.customer_email?.toLowerCase().includes(searchLower) ||
            txn.id.toLowerCase().includes(searchLower) ||
            txn.reference_code?.includes(searchTerm)
        );
    });

    const formatCurrency = (valueCents: number) => {
        // Convert cents to currency units
        return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(valueCents / 100);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: Transaction['status']) => {
        switch (status) {
            case 'paid':
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirmado
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <Clock className="w-3.5 h-3.5" />
                        Pendente
                    </span>
                );
            case 'failed':
            case 'canceled':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <XCircle className="w-3.5 h-3.5" />
                        Falhou
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {status || 'Desconhecido'}
                    </span>
                );
        }
    };

    const getMethodBadge = (method: Transaction['payment_method']) => {
        if (method === 'multicaixa' || method?.includes('express') || method?.includes('proxypay')) {
            // Assuming multicaixa typically maps to express visually, or generic fallback
            // Checking if method includes 'reference' might distinguish better if raw value differs
            if (method === 'reference') {
                return (
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white border border-slate-200 shadow-sm" title="Referência Bancária">
                        <img src={multicaixaLogo} alt="Referência" className="h-6 object-contain" />
                    </div>
                );
            }
            return (
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white border border-slate-200 shadow-sm" title="Multicaixa Express">
                    <img src={expressLogo} alt="Multicaixa Express" className="h-6 object-contain" />
                </div>
            );
        }
        // Fallback or explicit reference
        return (
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white border border-slate-200 shadow-sm" title="Referência Bancária">
                <img src={multicaixaLogo} alt="Referência" className="h-6 object-contain" />
            </div>
        );
    };

    // Summary Stats (calculated from loaded data - ideally should be separate count queries for scalability)
    const totalPaid = transactions.filter(t => t.status === 'paid' || t.status === 'completed').reduce((acc, t) => acc + t.amount_cents, 0);
    const totalPending = transactions.filter(t => t.status === 'pending').reduce((acc, t) => acc + t.amount_cents, 0);
    const totalFailed = transactions.filter(t => ['failed', 'canceled'].includes(t.status)).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Finanças</h1>
                    <p className="text-slate-600 mt-1">Acompanhe transações e pagamentos do checkout</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchTransactions} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-5 bg-white border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Total Recebido</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalPaid)}</p>
                        </div>
                        <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-white border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Pendente</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalPending)}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-white border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Transações Falhadas</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">{totalFailed}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                            <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Buscar por nome, email ou ID..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos Status</SelectItem>
                                <SelectItem value="completed">Confirmado</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="failed">Falhou</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={methodFilter} onValueChange={setMethodFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Método" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos Métodos</SelectItem>
                                <SelectItem value="multicaixa">Multicaixa Express</SelectItem>
                                <SelectItem value="reference">Referência Bancária</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Transactions Table */}
            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="font-semibold">ID</TableHead>
                            <TableHead className="font-semibold">Cliente</TableHead>
                            <TableHead className="font-semibold">Método</TableHead>
                            <TableHead className="font-semibold">Referência</TableHead>
                            <TableHead className="font-semibold text-right">Valor</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Data</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                    Nenhuma transação encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.map((txn) => (
                                <TableRow key={txn.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-mono text-xs text-slate-500" title={txn.id}>
                                        {txn.id.slice(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-slate-900">{txn.customer_name}</p>
                                            <p className="text-xs text-slate-500">{txn.customer_email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getMethodBadge(txn.payment_method)}</TableCell>
                                    <TableCell className="font-mono text-sm text-slate-600">
                                        {txn.reference_code || '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-slate-900">
                                        {formatCurrency(txn.amount_cents)}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(txn.status)}</TableCell>
                                    <TableCell className="text-sm text-slate-600">{formatDate(txn.created_at)}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
