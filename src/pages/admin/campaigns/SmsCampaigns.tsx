import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Users, Loader2, CheckCircle2, AlertCircle, ArrowLeft, MoreHorizontal, History } from "lucide-react";
import { API_URL } from "@/lib/supabase";
import api from "@/lib/api";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SmsCampaigns({ onBack }: { onBack: () => void }) {
    const [smsType, setSmsType] = useState<"single" | "bulk">("single");
    const [recipient, setRecipient] = useState("");
    const [recipients, setRecipients] = useState("");
    const [content, setContent] = useState("");
    const [sender, setSender] = useState("VibeCoding");
    const [tag, setTag] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<any>(null);

    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await api.get(`/api/sms/history`);
            setHistory(response.data.events || []);
        } catch (error) {
            console.error("Error fetching history:", error);
            toast.error("Erro ao carregar histórico");
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setResult(null);
        setIsLoading(true);

        try {
            if (content.length > 160) {
                toast.warning("Atenção: Mensagens com mais de 160 caracteres podem ser cobradas como múltiplos SMS.");
            }

            if (smsType === "single") {
                const response = await api.post(`/api/sms/send`, {
                    recipient,
                    content,
                    sender,
                    tag,
                    type: "transactional"
                });
                setResult(response.data);
                setSuccess(true);
                toast.success("SMS enviado com sucesso!");
            } else {
                const recipientList = recipients.split("\n").map(r => r.trim()).filter(r => r);
                const response = await api.post(`/api/sms/send-bulk`, {
                    recipients: recipientList,
                    content,
                    sender,
                    tag
                });
                setResult(response.data);
                setSuccess(true);
                toast.success(`Processo de envio iniciado para ${recipientList.length} números!`);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.message || "Erro ao enviar SMS");
            toast.error("Erro ao enviar SMS");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">SMS Transacional</h2>
                    <p className="text-slate-600">Envie notificações rápidas via SMS (Brevo)</p>
                </div>
            </div>

            <Tabs defaultValue="send" className="w-full" onValueChange={(val) => {
                if (val === 'history') fetchHistory();
            }}>
                <TabsList>
                    <TabsTrigger value="send">Enviar SMS</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="send" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Form */}
                        <Card className="lg:col-span-2 p-6 bg-white border border-gray-200">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* SMS Type */}
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setSmsType("single")}
                                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${smsType === "single"
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <MessageSquare className={`w-6 h-6 mx-auto mb-2 ${smsType === "single" ? "text-emerald-500" : "text-gray-400"}`} />
                                        <p className={`font-medium ${smsType === "single" ? "text-emerald-700" : "text-gray-600"}`}>
                                            SMS Único
                                        </p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSmsType("bulk")}
                                        className={`flex-1 p-4 rounded-xl border-2 transition-all ${smsType === "bulk"
                                            ? "border-emerald-500 bg-emerald-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <Users className={`w-6 h-6 mx-auto mb-2 ${smsType === "bulk" ? "text-emerald-500" : "text-gray-400"}`} />
                                        <p className={`font-medium ${smsType === "bulk" ? "text-emerald-700" : "text-gray-600"}`}>
                                            SMS em Massa
                                        </p>
                                    </button>
                                </div>

                                {/* Recipient(s) */}
                                {smsType === "single" ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="recipient" className="text-slate-700 font-medium">Número do Destinatário</Label>
                                        <Input
                                            id="recipient"
                                            type="tel"
                                            placeholder="Ex: 5511999999999"
                                            value={recipient}
                                            onChange={(e) => setRecipient(e.target.value)}
                                            className="h-12 bg-gray-50 border-gray-300"
                                            required
                                        />
                                        <p className="text-xs text-slate-500">Inclua o código do país (Ex: 55 para Brasil, 244 para Angola)</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="recipients" className="text-slate-700 font-medium">
                                            Números (um por linha)
                                        </Label>
                                        <Textarea
                                            id="recipients"
                                            placeholder="5511999999999&#10;244923456789"
                                            value={recipients}
                                            onChange={(e) => setRecipients(e.target.value)}
                                            className="min-h-[120px] bg-gray-50 border-gray-300"
                                            required
                                        />
                                    </div>
                                )}

                                {/* Sender Info */}
                                <div className="space-y-2">
                                    <Label htmlFor="sender" className="text-slate-700 font-medium">Remetente (Sender ID)</Label>
                                    <Input
                                        id="sender"
                                        value={sender}
                                        onChange={(e) => setSender(e.target.value)}
                                        maxLength={11}
                                        className="h-12 bg-gray-50 border-gray-300"
                                        placeholder="Ex: MinhaLoja"
                                    />
                                    <p className="text-xs text-slate-500">Máximo 11 caracteres alfanuméricos ou 15 numéricos.</p>
                                </div>

                                {/* Content */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label htmlFor="content" className="text-slate-700 font-medium">Mensagem</Label>
                                        <span className={`text-xs ${content.length > 160 ? "text-orange-500 font-bold" : "text-slate-400"}`}>
                                            {content.length} caracteres
                                        </span>
                                    </div>
                                    <Textarea
                                        id="content"
                                        placeholder="Sua mensagem aqui..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="min-h-[100px] bg-gray-50 border-gray-300"
                                        required
                                    />
                                </div>

                                {/* Tag */}
                                <div className="space-y-2">
                                    <Label htmlFor="tag" className="text-slate-700 font-medium">Tag (Opcional)</Label>
                                    <Input
                                        id="tag"
                                        value={tag}
                                        onChange={(e) => setTag(e.target.value)}
                                        className="h-12 bg-gray-50 border-gray-300"
                                        placeholder="Ex: promocao_carnaval"
                                    />
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold shadow-lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 mr-2" />
                                            Enviar SMS{smsType === "bulk" ? " em Massa" : ""}
                                        </>
                                    )}
                                </Button>
                            </form>
                        </Card>

                        {/* Status */}
                        <div className="space-y-4">
                            {success && (
                                <Card className="p-6 bg-green-50 border border-green-200">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-green-800 mb-1">SMS Enviado!</h3>
                                            {result && (
                                                <div className="text-sm text-green-700 space-y-1">
                                                    <p className="break-all text-xs font-mono">{JSON.stringify(result, null, 2)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {error && (
                                <Card className="p-6 bg-red-50 border border-red-200">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-red-800 mb-1">Erro ao enviar</h3>
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            <Card className="p-6 bg-emerald-50 border border-emerald-200">
                                <h3 className="font-semibold text-emerald-800 mb-3">💡 Dicas SMS</h3>
                                <ul className="text-sm text-emerald-700 space-y-2">
                                    <li>• Mensagens com mais de 160 caracteres são divididas</li>
                                    <li>• Sender ID deve ser curto (max 11 chars)</li>
                                    <li>• Sempre inclua o código do país</li>
                                    <li>• Use tags para organizar seus relatórios</li>
                                </ul>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-800">Histórico de Envios (Últimos 30 dias)</h3>
                            <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loadingHistory}>
                                {loadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : <History className="w-4 h-4 mr-2" />}
                                Atualizar
                            </Button>
                        </div>

                        {loadingHistory ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Nenhum histórico de SMS encontrado para este período.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-medium">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Data</th>
                                            <th className="px-4 py-3">Destinatário</th>
                                            <th className="px-4 py-3">Evento</th>
                                            <th className="px-4 py-3">Detalhes</th>
                                            <th className="px-4 py-3 rounded-tr-lg">Tag</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {history.map((event, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 text-slate-500">
                                                    {new Date(event.date).toLocaleString('pt-BR')}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-900">
                                                    {event.phoneNumber}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                        ${event.event === 'delivered' ? 'bg-green-100 text-green-700' :
                                                            event.event === 'sent' ? 'bg-blue-100 text-blue-700' :
                                                                event.event === 'accepted' ? 'bg-blue-50 text-blue-600' :
                                                                    'bg-red-100 text-red-700'
                                                        }`}>
                                                        {event.event}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {event.reason || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-400">
                                                    {event.tag || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default SmsCampaigns;
