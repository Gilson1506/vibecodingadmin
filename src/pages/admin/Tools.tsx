import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
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
  Wrench,
  ExternalLink,
  Pencil,
  Trash2,
  ImagePlus,
  X,
  Tag,
  FileText,
  Image,
  File,
  Paperclip,
  Loader2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
}

interface OrientationFile {
  id: string;
  name: string;
  file_type: 'image' | 'pdf';
  file_url: string;
  file_size: number;
}

interface Tool {
  id: string;
  name: string;
  type: string;
  description: string;
  url: string;
  cover_url: string;
  is_available: boolean;
  category_id: string;
  orientation_text?: string;
  tool_orientation_files?: OrientationFile[];
  categories?: {
    name: string;
  };
}

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const orientationFileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    url: '',
    imageUrl: '',
    available: true,
    categoryId: '',
    orientationText: '',
    orientationFiles: [] as OrientationFile[]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('type', 'tools')
        .order('order_index');

      if (catError) throw catError;
      setCategories(catData || []);

      // Fetch tools
      const { data: toolsData, error: toolsError } = await supabase
        .from('tools')
        .select('*, categories(name), tool_orientation_files(*)')
        .order('created_at', { ascending: false });

      if (toolsError) throw toolsError;
      setTools(toolsData || []);
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
      name: '',
      type: '',
      description: '',
      url: '',
      imageUrl: '',
      available: true,
      categoryId: categories[0]?.id || '',
      orientationText: '',
      orientationFiles: []
    });
    setEditingTool(null);
  };

  const handleOpenDialog = (tool?: Tool) => {
    if (tool) {
      setEditingTool(tool);
      setFormData({
        name: tool.name,
        type: tool.type,
        description: tool.description || '',
        url: tool.url,
        imageUrl: tool.cover_url || '',
        available: tool.is_available,
        categoryId: tool.category_id,
        orientationText: tool.orientation_text || '',
        orientationFiles: (tool.tool_orientation_files || []) as OrientationFile[]
      });
    } else {
      resetForm();
      if (categories.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
      }
    }
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingImage(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // Bucket tool-covers

        const { error: uploadError } = await supabase.storage
          .from('tool-covers')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('tool-covers')
          .getPublicUrl(filePath);

        setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
        toast.success('Capa carregada!');
      } catch (error: any) {
        toast.error('Erro no upload: ' + error.message);
      } finally {
        setUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleOrientationFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setUploadingFile(true);
      const newFiles: OrientationFile[] = [];
      let successCount = 0;

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          const filePath = `${fileName}`; // Bucket tool-files

          const { error: uploadError } = await supabase.storage
            .from('tool-files')
            .upload(filePath, file);

          if (uploadError) {
            console.error('Error uploading file:', file.name, uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('tool-files')
            .getPublicUrl(filePath);

          const isImage = file.type.startsWith('image/');

          newFiles.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            file_type: isImage ? 'image' : 'pdf',
            file_url: publicUrl,
            file_size: file.size
          });
          successCount++;
        }

        if (newFiles.length > 0) {
          setFormData(prev => ({
            ...prev,
            orientationFiles: [...prev.orientationFiles, ...newFiles]
          }));
          toast.success(`${successCount} arquivo(s) adicionado(s)!`);
        }
      } catch (error: any) {
        toast.error('Erro no upload de arquivos: ' + error.message);
      } finally {
        setUploadingFile(false);
        if (orientationFileInputRef.current) {
          orientationFileInputRef.current.value = '';
        }
      }
    }
  };

  const removeOrientationFile = (fileId: string) => {
    setFormData(prev => ({
      ...prev,
      orientationFiles: prev.orientationFiles.filter(f => f.id !== fileId)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome da ferramenta é obrigatório");
      return;
    }
    if (!formData.categoryId) {
      toast.error("Categoria é obrigatória");
      return;
    }

    setSaving(true);
    try {
      // 1. Save Tool (without orientation files)
      const toolData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        url: formData.url,
        cover_url: formData.imageUrl,
        is_available: formData.available,
        category_id: formData.categoryId,
        orientation_text: formData.orientationText
      };

      let toolId = editingTool?.id;

      if (editingTool) {
        const { error } = await supabase
          .from('tools')
          .update(toolData)
          .eq('id', editingTool.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('tools')
          .insert(toolData)
          .select()
          .single();

        if (error) throw error;
        toolId = data.id;
      }

      if (toolId) {
        // 2. Sync Orientation Files
        // Strategy: Delete all existing files for this tool and re-insert current ones
        // This is simpler than differencing and safe for this data scale

        // Delete old
        const { error: deleteError } = await supabase
          .from('tool_orientation_files')
          .delete()
          .eq('tool_id', toolId);

        if (deleteError) throw deleteError;

        // Insert new
        if (formData.orientationFiles.length > 0) {
          const filesToInsert = formData.orientationFiles.map((file, index) => ({
            tool_id: toolId,
            name: file.name,
            file_type: file.file_type, // Already mapped in handleFileUpload
            file_url: file.file_url, // Already mapped
            file_size: file.file_size, // Already mapped
            order_index: index
          }));

          const { error: insertError } = await supabase
            .from('tool_orientation_files')
            .insert(filesToInsert);

          if (insertError) throw insertError;
        }
      }

      toast.success(editingTool ? "Ferramenta atualizada!" : "Ferramenta criada!");
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ferramenta?')) return;

    try {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Ferramenta removida!");
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const filteredTools = filterCategory === "all"
    ? tools
    : tools.filter(t => t.category_id === filterCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ferramentas</h1>
          <p className="text-slate-600 mt-1">Gerencie as ferramentas disponíveis para os alunos</p>
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
                Nova Ferramenta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTool ? 'Editar Ferramenta' : 'Nova Ferramenta'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os formulários abaixo para gerenciar a ferramenta.
                </DialogDescription>
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

                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <Label>Capa da Ferramenta</Label>
                  <div
                    className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden cursor-pointer hover:border-sky-400 transition-colors"
                    onClick={() => !uploadingImage && fileInputRef.current?.click()}
                  >
                    {uploadingImage ? (
                      <div className="h-36 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
                        <p className="text-sm">Enviando capa...</p>
                      </div>
                    ) : formData.imageUrl ? (
                      <div className="relative">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-full h-36 object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, imageUrl: '' });
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-36 flex flex-col items-center justify-center text-slate-400">
                        <ImagePlus className="w-10 h-10 mb-2" />
                        <p className="text-sm">Clique para enviar uma imagem</p>
                        <p className="text-xs">PNG, JPG</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label>Nome da Ferramenta *</Label>
                  <Input
                    placeholder="Ex: VS Code Online"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Input
                    placeholder="Ex: IDE, Editor, VCS"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva a ferramenta..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>

                {/* Orientation Section */}
                <div className="space-y-3 p-4 bg-sky-50 rounded-xl border border-sky-100">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-sky-600" />
                    <Label className="text-sky-900 font-semibold">Orientação de Uso</Label>
                  </div>

                  {/* Orientation Text */}
                  <Textarea
                    placeholder="Instruções de como usar esta ferramenta, dicas, configurações recomendadas..."
                    value={formData.orientationText}
                    onChange={(e) => setFormData({ ...formData, orientationText: e.target.value })}
                    rows={3}
                    className="bg-white"
                  />

                  {/* Orientation Files Upload */}
                  <div>
                    <button
                      type="button"
                      onClick={() => orientationFileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="w-full border-2 border-dashed border-sky-300 rounded-lg p-3 text-sky-600 hover:bg-sky-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <File className="w-4 h-4" />}
                      <span className="text-sm">{uploadingFile ? 'Enviando...' : 'Adicionar Fotos ou PDFs de Apoio'}</span>
                    </button>
                    <input
                      ref={orientationFileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleOrientationFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Orientation Files List */}
                  {formData.orientationFiles.length > 0 && (
                    <div className="space-y-2">
                      {formData.orientationFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between bg-white rounded-lg p-2 border border-sky-200"
                        >
                          <div className="flex items-center gap-2">
                            {file.type === 'image' ? (
                              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                                <Image className="w-4 h-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                <FileText className="w-4 h-4 text-red-600" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{file.name}</p>
                              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOrientationFile(file.id)}
                            className="text-red-500 hover:text-red-600 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Switch */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <Label htmlFor="available" className="cursor-pointer">Disponível para alunos</Label>
                  <Switch
                    id="available"
                    checked={formData.available}
                    onCheckedChange={(checked) => setFormData({ ...formData, available: checked })}
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
                    disabled={saving || uploadingImage || uploadingFile}
                    className="flex-1 bg-sky-500 hover:bg-sky-600"
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingTool ? 'Salvar Alterações' : 'Criar Ferramenta'}
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

      {/* Tools Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <Card key={tool.id} className="overflow-hidden bg-white hover:shadow-lg transition-shadow">
              <img
                src={tool.cover_url || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400'}
                alt={tool.name}
                className="w-full h-36 object-cover"
              />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{tool.name}</h3>
                      <p className="text-xs text-slate-500">{tool.type}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${tool.is_available
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    {tool.is_available ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-slate-600 text-sm mb-3 line-clamp-2">{tool.description}</p>

                {/* Category Badge */}
                <div className="flex items-center gap-1 text-xs text-sky-600 mb-2">
                  <Tag className="w-3 h-3" />
                  <span>{tool.categories?.name || 'Sem categoria'}</span>
                </div>

                {/* Orientation indicator */}
                {(tool.orientation_text || (tool.tool_orientation_files)?.length > 0) && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 mb-3">
                    <Paperclip className="w-3 h-3" />
                    <span>
                      Orientação incluída
                      {(tool.tool_orientation_files)?.length > 0 && ` (${(tool.tool_orientation_files).length} arquivo${(tool.tool_orientation_files).length > 1 ? 's' : ''})`}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <a href={tool.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Abrir
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(tool)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(tool.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {filteredTools.length === 0 && (
            <Card className="col-span-full p-12 text-center">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhuma ferramenta encontrada</h3>
              <p className="text-slate-500">Crie uma nova ferramenta usando o botão acima.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
