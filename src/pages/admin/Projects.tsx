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
    Plus,
    Package,
    ExternalLink,
    Pencil,
    Trash2,
    ImagePlus,
    X,
    FileText,
    Image,
    File,
    Paperclip,
    Loader2,
    RefreshCw,
    PlusCircle,
    Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Preview {
    label: string;
    url: string;
}

interface ProjectFile {
    id: string;
    name: string;
    file_type: string;
    file_url: string;
}

interface Project {
    id: string;
    title: string;
    description: string;
    price_cents: number;
    cover_url: string;
    is_published: boolean;
    details_json: any;
    previews: Preview[];
    project_files?: ProjectFile[];
}

export default function AdminProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const projectFileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price_cents: 0,
        cover_url: '',
        images_urls: [] as string[],
        is_published: true,
        long_description: '',
        previews: [] as Preview[],
        files: [] as ProjectFile[]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*, project_files(*)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (error: any) {
            toast.error('Erro ao carregar projetos: ' + error.message);
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
            price_cents: 0,
            cover_url: '',
            is_published: true,
            long_description: '',
            previews: [],
            files: []
        });
        setEditingProject(null);
    };

    const handleOpenDialog = (project?: Project) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                title: project.title,
                description: project.description,
                price_cents: project.price_cents,
                cover_url: project.cover_url || '',
                images_urls: project.images_urls || [],
                is_published: project.is_published,
                long_description: project.details_json?.long_description || '',
                previews: project.previews || [],
                files: (project.project_files || []) as ProjectFile[]
            });
        } else {
            resetForm();
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
                const filePath = `${fileName}`;

                // Using projects-covers bucket
                const { error: uploadError } = await supabase.storage
                    .from('projects-covers')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('projects-covers')
                    .getPublicUrl(filePath);

                setFormData(prev => ({ ...prev, cover_url: publicUrl }));
                toast.success('Capa carregada!');
            } catch (error: any) {
                toast.error('Erro no upload da capa: ' + error.message);
            } finally {
                setUploadingImage(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setUploadingGallery(true);
            const newUrls: string[] = [];

            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('projects-covers')
                        .upload(filePath, file);

                    if (uploadError) continue;

                    const { data: { publicUrl } } = supabase.storage
                        .from('projects-covers')
                        .getPublicUrl(filePath);

                    newUrls.push(publicUrl);
                }

                if (newUrls.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        images_urls: [...prev.images_urls, ...newUrls]
                    }));
                    toast.success('Galeria atualizada!');
                }
            } catch (error: any) {
                toast.error('Erro no upload da galeria: ' + error.message);
            } finally {
                setUploadingGallery(false);
                if (galleryInputRef.current) galleryInputRef.current.value = '';
            }
        }
    };

    const handleProjectFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setUploadingFile(true);
            const newFiles: ProjectFile[] = [];

            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('projects-files') // Use projects-files bucket
                        .upload(filePath, file);

                    if (uploadError) continue;

                    const { data: { publicUrl } } = supabase.storage
                        .from('projects-files')
                        .getPublicUrl(filePath);

                    newFiles.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        name: file.name,
                        file_type: fileExt || 'doc',
                        file_url: publicUrl
                    });
                }

                if (newFiles.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        files: [...prev.files, ...newFiles]
                    }));
                    toast.success('Arquivo(s) adicionado(s)!');
                }
            } catch (error: any) {
                toast.error('Erro no upload de arquivos: ' + error.message);
            } finally {
                setUploadingFile(false);
                if (projectFileInputRef.current) projectFileInputRef.current.value = '';
            }
        }
    };

    const addPreviewLink = () => {
        if (formData.previews.length >= 4) {
            toast.warning("Limite máximo de 4 previews atingido.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            previews: [...prev.previews, { label: 'Novo Link', url: '' }]
        }));
    };

    const updatePreview = (idx: number, field: keyof Preview, value: string) => {
        const newPreviews = [...formData.previews];
        newPreviews[idx] = { ...newPreviews[idx], [field]: value };
        setFormData(prev => ({ ...prev, previews: newPreviews }));
    };

    const removePreview = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            previews: prev.previews.filter((_, i) => i !== idx)
        }));
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            toast.error("Título é obrigatório");
            return;
        }

        setSaving(true);
        try {
            const projectData = {
                title: formData.title,
                description: formData.description,
                price_cents: formData.price_cents,
                cover_url: formData.cover_url,
                images_urls: formData.images_urls,
                is_published: formData.is_published,
                details_json: { long_description: formData.long_description },
                previews: formData.previews
            };

            let projectId = editingProject?.id;

            if (editingProject) {
                const { error } = await supabase
                    .from('projects')
                    .update(projectData)
                    .eq('id', editingProject.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('projects')
                    .insert(projectData)
                    .select()
                    .single();
                if (error) throw error;
                projectId = data.id;
            }

            if (projectId) {
                // Sync Files
                await supabase.from('project_files').delete().eq('project_id', projectId);

                if (formData.files.length > 0) {
                    const filesToInsert = formData.files.map((file, index) => ({
                        project_id: projectId,
                        name: file.name,
                        file_type: file.file_type,
                        file_url: file.file_url,
                        order_index: index
                    }));
                    await supabase.from('project_files').insert(filesToInsert);
                }
            }

            toast.success(editingProject ? "Projeto atualizado!" : "Projeto criado!");
            setIsDialogOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
        try {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;
            toast.success("Projeto removido!");
            fetchData();
        } catch (error: any) {
            toast.error('Erro ao excluir: ' + error.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Projetos</h1>
                    <p className="text-slate-600 mt-1">Gerencie os projetos disponíveis na vitrine</p>
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
                            <Button className="bg-sky-500 hover:bg-sky-600">
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Projeto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingProject ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
                                <DialogDescription>Poste e gerencie detalhes do projeto.</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Título *</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Ex: SaaS Boilerplate"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Preço (Cêntimos) *</Label>
                                        <Input
                                            type="number"
                                            value={formData.price_cents}
                                            onChange={e => setFormData({ ...formData, price_cents: parseInt(e.target.value) || 0 })}
                                            placeholder="500000 para 5.000,00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Descrição Curta (Vitrine)</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Breve resumo do que é o projeto"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Descrição Completa (MD/Detalhes)</Label>
                                    <Textarea
                                        value={formData.long_description}
                                        onChange={e => setFormData({ ...formData, long_description: e.target.value })}
                                        placeholder="Descreva todos os detalhes, funcionalidades e tecnologias..."
                                        rows={4}
                                    />
                                </div>

                                {/* Cover */}
                                <div className="space-y-2">
                                    <Label>Capa do Projeto</Label>
                                    <div
                                        className="relative h-40 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-sky-400 transition-all overflow-hidden"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {uploadingImage ? (
                                            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                                        ) : formData.cover_url ? (
                                            <img src={formData.cover_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <ImagePlus className="text-slate-400 mb-2" />
                                                <span className="text-sm text-slate-500">Enviar Imagem da Capa</span>
                                            </>
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </div>

                                {/* Gallery */}
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2">
                                        <Image className="w-4 h-4" /> Galeria de Imagens (Carrossel)
                                    </Label>
                                    <Button
                                        variant="outline"
                                        className="w-full border-dashed border-sky-300 text-sky-600"
                                        onClick={() => galleryInputRef.current?.click()}
                                        disabled={uploadingGallery}
                                    >
                                        {uploadingGallery ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                                        Adicionar Imagens à Galeria
                                    </Button>
                                    <input ref={galleryInputRef} type="file" multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />

                                    {formData.images_urls.length > 0 && (
                                        <div className="grid grid-cols-4 gap-2">
                                            {formData.images_urls.map((url, idx) => (
                                                <div key={idx} className="relative aspect-video group border rounded-lg overflow-hidden bg-slate-100">
                                                    <img src={url} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, images_urls: prev.images_urls.filter((_, i) => i !== idx) }))}
                                                        className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Preview Links - Max 4 */}
                                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <Label className="flex items-center gap-2">
                                            <LinkIcon size={16} /> Link de Previews (Max 4)
                                        </Label>
                                        <Button size="sm" variant="ghost" className="text-sky-600" onClick={addPreviewLink} disabled={formData.previews.length >= 4}>
                                            <Plus size={16} className="mr-1" /> Adicionar
                                        </Button>
                                    </div>
                                    <div className="grid gap-3">
                                        {formData.previews.map((prev, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <Input
                                                    className="flex-1"
                                                    placeholder="Rótulo (Ex: Admin)"
                                                    value={prev.label}
                                                    onChange={e => updatePreview(idx, 'label', e.target.value)}
                                                />
                                                <Input
                                                    className="flex-[2]"
                                                    placeholder="URL (https://...)"
                                                    value={prev.url}
                                                    onChange={e => updatePreview(idx, 'url', e.target.value)}
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => removePreview(idx)}>
                                                    <X size={16} className="text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Files Management */}
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2">
                                        <Paperclip size={16} /> Arquivos para Compradores
                                    </Label>
                                    <Button
                                        variant="outline"
                                        className="w-full border-dashed border-sky-300 text-sky-600"
                                        onClick={() => projectFileInputRef.current?.click()}
                                        disabled={uploadingFile}
                                    >
                                        {uploadingFile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
                                        Adicionar Arquivos (Doc, Zip, PDF)
                                    </Button>
                                    <input ref={projectFileInputRef} type="file" multiple className="hidden" onChange={handleProjectFileUpload} />

                                    <div className="grid gap-2">
                                        {formData.files.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                                <div className="flex items-center gap-2 truncate">
                                                    <FileText size={16} className="text-slate-400" />
                                                    <span className="text-sm font-medium truncate">{file.name}</span>
                                                </div>
                                                <Button size="icon" variant="ghost" onClick={() => setFormData({ ...formData, files: formData.files.filter((_, i) => i !== idx) })}>
                                                    <Trash2 size={16} className="text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <Label>Publicado / Visível na Vitrine</Label>
                                    <Switch checked={formData.is_published} onCheckedChange={val => setFormData({ ...formData, is_published: val })} />
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                                    <Button className="flex-1 bg-sky-500 hover:bg-sky-600" onClick={handleSave} disabled={saving}>
                                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {editingProject ? 'Salvar Projeto' : 'Criar Projeto'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* List Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(p => (
                        <Card key={p.id} className="overflow-hidden bg-white hover:shadow-md transition-all group">
                            <div className="h-40 relative bg-slate-100">
                                {p.cover_url ? (
                                    <img src={p.cover_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Package size={48} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm ${p.is_published ? 'bg-green-500' : 'bg-slate-500'}`}>
                                        {p.is_published ? 'ATIVO' : 'RASCUNHO'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-slate-800 truncate">{p.title}</h3>
                                <p className="text-xs text-slate-500 mt-1">Preço: {(p.price_cents / 100).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                                <div className="mt-4 flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenDialog(p)}>
                                        <Pencil className="w-4 h-4 mr-2" /> Editar
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
