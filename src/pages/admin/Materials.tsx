import { useState, useEffect, useRef } from "react";
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
import {
  Plus,
  FileText,
  Download,
  Pencil,
  Trash2,
  Upload,
  File,
  X,
  Tag,
  Loader2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
}

interface Material {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'excel' | 'word' | 'other';
  file_name: string;
  file_url: string;
  file_size: number;
  category_id: string;
  created_at: string;
  categories?: {
    name: string;
  };
}

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return { bg: 'bg-red-100', color: 'text-red-600', label: 'PDF' };
    case 'excel':
      return { bg: 'bg-green-100', color: 'text-green-600', label: 'EXCEL' };
    case 'word':
      return { bg: 'bg-blue-100', color: 'text-blue-600', label: 'WORD' };
    default:
      return { bg: 'bg-slate-100', color: 'text-slate-600', label: 'FILE' };
  }
};

const getFileType = (fileName: string): 'pdf' | 'excel' | 'word' | 'other' => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'excel';
  if (['doc', 'docx'].includes(ext || '')) return 'word';
  return 'other';
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    fileName: '',
    fileUrl: '',
    fileSize: 0,
    type: 'pdf' as 'pdf' | 'excel' | 'word' | 'other'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('type', 'materials')
        .order('order_index');

      if (catError) throw catError;
      setCategories(catData || []);

      // Fetch materials
      const { data: matData, error: matError } = await supabase
        .from('materials')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });

      if (matError) throw matError;
      setMaterials(matData || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      categoryId: categories[0]?.id || '',
      fileName: '',
      fileUrl: '',
      fileSize: 0,
      type: 'pdf'
    });
    setEditingMaterial(null);
  };

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        title: material.title,
        description: material.description || '',
        categoryId: material.category_id,
        fileName: material.file_name,
        fileUrl: material.file_url,
        fileSize: material.file_size,
        type: material.type
      });
    } else {
      resetForm();
      if (categories.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
      }
    }
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `files/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('materials')
          .getPublicUrl(filePath);

        const fileType = getFileType(file.name);
        setFormData({
          ...formData,
          fileName: file.name,
          fileUrl: publicUrl,
          fileSize: file.size,
          type: fileType,
          title: formData.title || file.name.replace(/\.[^/.]+$/, '')
        });
        toast.success(`Arquivo "${file.name}" carregado!`);
      } catch (error: any) {
        toast.error('Erro no upload: ' + error.message);
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Título do material é obrigatório");
      return;
    }
    if (!formData.categoryId) {
      toast.error("Categoria é obrigatória");
      return;
    }

    setSaving(true);
    try {
      const materialData = {
        title: formData.title,
        description: formData.description,
        type: ['pdf', 'video', 'link', 'file'].includes(formData.type) ? formData.type : 'file',
        // file_name removido pois não existe no banco
        file_url: formData.fileUrl,
        file_size: formData.fileSize,
        category_id: formData.categoryId
      };

      if (editingMaterial) {
        const { error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', editingMaterial.id);

        if (error) throw error;
        toast.success("Material atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('materials')
          .insert(materialData);

        if (error) throw error;
        toast.success("Material criado com sucesso!");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este material?')) return;

    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Material removido!");
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredMaterials = filterCategory === "all"
    ? materials
    : materials.filter(m => m.category_id === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Materiais</h1>
          <p className="text-slate-600 mt-1">Gerencie os materiais de apoio (PDF, Excel, Word)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
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
                Novo Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMaterial ? 'Editar Material' : 'Novo Material'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Category Selector */}
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Arquivo (PDF, Excel, Word)</Label>
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-xl p-4 cursor-pointer hover:border-sky-400 transition-colors"
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
                        <p className="text-sm text-slate-500">Enviando arquivo...</p>
                      </div>
                    ) : formData.fileName ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getFileIcon(formData.type).bg}`}>
                            <File className={`w-5 h-5 ${getFileIcon(formData.type).color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{formData.fileName}</p>
                            <p className="text-xs text-slate-500">{formatFileSize(formData.fileSize)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, fileName: '', fileUrl: '', fileSize: 0 });
                          }}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <Upload className="w-10 h-10 mb-2" />
                        <p className="text-sm">Clique para enviar um arquivo</p>
                        <p className="text-xs">PDF, DOC, DOCX, XLS, XLSX</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label>Título do Material *</Label>
                  <Input
                    placeholder="Ex: Guia de Flexbox CSS"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva o conteúdo do material..."
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
                    disabled={saving || uploading}
                    className="flex-1 bg-sky-500 hover:bg-sky-600"
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingMaterial ? 'Salvar Alterações' : 'Criar Material'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

      </div>

      {/* Filter by Category */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterCategory === "all" ? "default" : "outline"}
          onClick={() => setFilterCategory("all")}
          size="sm"
          className={filterCategory === "all" ? "bg-sky-500 hover:bg-sky-600" : ""}
        >
          Todas Categorias
        </Button>
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={filterCategory === cat.id ? "default" : "outline"}
            onClick={() => setFilterCategory(cat.id)}
            size="sm"
            className={filterCategory === cat.id ? "bg-sky-500 hover:bg-sky-600" : ""}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => {
            const fileStyle = getFileIcon(material.type);
            return (
              <Card key={material.id} className="p-5 bg-white hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${fileStyle.bg}`}>
                    <FileText className={`w-6 h-6 ${fileStyle.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{material.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${fileStyle.bg} ${fileStyle.color}`}>
                        {fileStyle.label}
                      </span>
                      <span className="text-xs text-slate-400">{formatFileSize(material.file_size)}</span>
                    </div>
                  </div>
                </div>

                {material.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{material.description}</p>
                )}

                {/* Category Badge */}
                <div className="flex items-center gap-1 text-xs text-sky-600 mb-4">
                  <Tag className="w-3 h-3" />
                  <span>{material.categories?.name || 'Sem categoria'}</span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href={material.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(material)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(material.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            );
          })}
          {filteredMaterials.length === 0 && (
            <Card className="col-span-full p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum material encontrado</h3>
              <p className="text-slate-500">Crie um novo material usando o botão acima.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
