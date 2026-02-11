import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Tag, Pencil, Trash2, Wrench, FileText, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Category {
    id: string;
    name: string;
    description: string;
    type: 'tools' | 'materials';
    order_index: number;
    created_at: string;
    itemCount?: number;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [filterType, setFilterType] = useState<string>("all");

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'tools' as 'tools' | 'materials'
    });

    // Fetch categories with item counts
    const fetchCategories = async () => {
        setLoading(true);
        try {
            // Fetch categories
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .order('type')
                .order('order_index');

            if (categoriesError) throw categoriesError;

            // Fetch item counts for tools
            const { data: toolsCounts } = await supabase
                .from('tools')
                .select('category_id');

            // Fetch item counts for materials
            const { data: materialsCounts } = await supabase
                .from('materials')
                .select('category_id');

            // Calculate counts
            const categoriesWithCounts = (categoriesData || []).map(cat => {
                let count = 0;
                if (cat.type === 'tools') {
                    count = toolsCounts?.filter(t => t.category_id === cat.id).length || 0;
                } else {
                    count = materialsCounts?.filter(m => m.category_id === cat.id).length || 0;
                }
                return { ...cat, itemCount: count };
            });

            setCategories(categoriesWithCounts);
        } catch (error: any) {
            toast.error('Erro ao carregar categorias: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const resetForm = () => {
        setFormData({ name: '', description: '', type: 'tools' });
        setEditingCategory(null);
    };

    const handleOpenDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                type: category.type
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Nome da categoria é obrigatório");
            return;
        }

        setSaving(true);
        try {
            if (editingCategory) {
                // Update existing
                const { error } = await supabase
                    .from('categories')
                    .update({
                        name: formData.name,
                        description: formData.description,
                        type: formData.type
                    })
                    .eq('id', editingCategory.id);

                if (error) throw error;
                toast.success("Categoria atualizada com sucesso!");
            } else {
                // Create new
                const { error } = await supabase
                    .from('categories')
                    .insert({
                        name: formData.name,
                        description: formData.description,
                        type: formData.type,
                        order_index: categories.filter(c => c.type === formData.type).length
                    });

                if (error) throw error;
                toast.success("Categoria criada com sucesso!");
            }

            setIsDialogOpen(false);
            resetForm();
            fetchCategories();
        } catch (error: any) {
            toast.error('Erro: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success("Categoria removida!");
            fetchCategories();
        } catch (error: any) {
            toast.error('Erro ao excluir: ' + error.message);
        }
    };

    const filteredCategories = filterType === "all"
        ? categories
        : categories.filter(c => c.type === filterType);

    const toolsCategories = categories.filter(c => c.type === 'tools');
    const materialsCategories = categories.filter(c => c.type === 'materials');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Categorias</h1>
                    <p className="text-slate-600 mt-1">Gerencie categorias para Ferramentas e Materiais</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchCategories} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button className="bg-sky-500 hover:bg-sky-600" onClick={() => handleOpenDialog()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Categoria
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {/* Type Select */}
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: 'tools' | 'materials') => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tools">
                                                <div className="flex items-center gap-2">
                                                    <Wrench className="w-4 h-4" />
                                                    Ferramentas
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="materials">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4" />
                                                    Materiais
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Name */}
                                <div className="space-y-2">
                                    <Label>Nome da Categoria *</Label>
                                    <Input
                                        placeholder="Ex: IDEs e Editores"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label>Descrição</Label>
                                    <Textarea
                                        placeholder="Descreva brevemente esta categoria..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setIsDialogOpen(false); resetForm(); }}
                                        className="flex-1"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 bg-sky-500 hover:bg-sky-600"
                                    >
                                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                            <Tag className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
                            <p className="text-sm text-slate-600">Total Categorias</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{toolsCategories.length}</p>
                            <p className="text-sm text-slate-600">Ferramentas</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{materialsCategories.length}</p>
                            <p className="text-sm text-slate-600">Materiais</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                <Button
                    variant={filterType === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilterType('all')}
                    className={filterType === 'all' ? 'bg-sky-500' : ''}
                >
                    Todas
                </Button>
                <Button
                    variant={filterType === 'tools' ? 'default' : 'outline'}
                    onClick={() => setFilterType('tools')}
                    className={filterType === 'tools' ? 'bg-purple-500' : ''}
                >
                    <Wrench className="w-4 h-4 mr-2" />
                    Ferramentas
                </Button>
                <Button
                    variant={filterType === 'materials' ? 'default' : 'outline'}
                    onClick={() => setFilterType('materials')}
                    className={filterType === 'materials' ? 'bg-green-500' : ''}
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Materiais
                </Button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCategories.map((category) => (
                        <Card key={category.id} className="p-4 bg-white hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.type === 'tools' ? 'bg-purple-100' : 'bg-green-100'
                                        }`}>
                                        {category.type === 'tools' ? (
                                            <Wrench className="w-5 h-5 text-purple-600" />
                                        ) : (
                                            <FileText className="w-5 h-5 text-green-600" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{category.name}</h3>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                            {category.description || 'Sem descrição'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${category.type === 'tools'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-green-100 text-green-700'
                                                }`}>
                                                {category.itemCount} itens
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenDialog(category)}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(category.id)}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {filteredCategories.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            Nenhuma categoria encontrada
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
