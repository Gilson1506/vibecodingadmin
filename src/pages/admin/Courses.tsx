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
  BookOpen,
  Users,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_url: string;
  price_cents: number;
  total_lessons: number;
  duration_minutes: number;
  is_published: boolean;
  order_index: number;
  created_at: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_cents: 60000,
    cover_url: '',
    status: 'draft' as 'published' | 'draft'
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar cursos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price_cents: 60000,
      cover_url: '',
      status: 'draft'
    });
    setEditingCourse(null);
  };

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description || '',
        price_cents: course.price_cents,
        cover_url: course.cover_url || '',
        status: course.is_published ? 'published' : 'draft'
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-covers')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, cover_url: publicUrl }));
      toast.success('Imagem carregada com sucesso!');
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Título do curso é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const slug = generateSlug(formData.title);
      const is_published = formData.status === 'published';

      if (editingCourse) {
        // Update existing
        const { error } = await supabase
          .from('courses')
          .update({
            title: formData.title,
            description: formData.description,
            price_cents: formData.price_cents,
            cover_url: formData.cover_url,
            is_published,
            slug: slug !== editingCourse.slug ? slug : undefined
          })
          .eq('id', editingCourse.id);

        if (error) throw error;
        toast.success("Curso atualizado com sucesso!");
      } else {
        // Create new
        const { error } = await supabase
          .from('courses')
          .insert({
            title: formData.title,
            slug,
            description: formData.description,
            price_cents: formData.price_cents,
            cover_url: formData.cover_url,
            is_published,
            order_index: courses.length
          });

        if (error) throw error;
        toast.success("Curso criado com sucesso!");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Curso removido!");
      fetchCourses();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cursos</h1>
          <p className="text-slate-600 mt-1">Gerencie os cursos e módulos da plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCourses} disabled={loading}>
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
                Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? 'Editar Curso' : 'Novo Curso'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Título do Curso *</Label>
                    <Input
                      placeholder="Ex: Fullstack Master"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preço (Kz)</Label>
                    <Input
                      type="number"
                      placeholder="60000"
                      value={formData.price_cents}
                      onChange={(e) => setFormData({ ...formData, price_cents: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'published' | 'draft') => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descrição detalhada do curso..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Capa do Curso</Label>
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-20 bg-slate-100 rounded border overflow-hidden flex-shrink-0">
                      {formData.cover_url ? (
                        <img src={formData.cover_url} alt="Capa" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Carregar Imagem
                      </Button>
                      <Input
                        placeholder="Ou cole a URL da imagem..."
                        value={formData.cover_url}
                        onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

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
                    {editingCourse ? 'Salvar Alterações' : 'Criar Curso'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden bg-white hover:shadow-lg transition-shadow group">
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                {course.cover_url ? (
                  <img
                    src={course.cover_url}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 bg-white/90 p-1 rounded-lg shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-white"
                    onClick={() => handleOpenDialog(course)}
                  >
                    <Pencil className="w-4 h-4 text-slate-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-white"
                    onClick={() => handleDelete(course.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${course.is_published
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-500 text-white'
                    }`}>
                    {course.is_published ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{course.title}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[40px]">
                  {course.description || 'Sem descrição'}
                </p>

                <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.total_lessons || 0} aulas</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="font-bold text-sky-600">
                    {course.price_cents > 0
                      ? (course.price_cents).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })
                      : 'Grátis'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              Nenhum curso encontrado. Crie o primeiro!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
