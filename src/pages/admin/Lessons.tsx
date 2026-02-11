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
import MuxPlayer from "@mux/mux-player-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Clock,
  Pencil,
  Trash2,
  Video,
  Play,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  FileVideo
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import api from "@/lib/api";

interface Lesson {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  course_id: string;
  duration_seconds: number;
  order_index: number;
  is_published: boolean;
  mux_playback_id?: string;
  mux_asset_id?: string;
  courses?: {
    title: string;
  };
}

interface Course {
  id: string;
  title: string;
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true); // Manter existente



  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [filterCourse, setFilterCourse] = useState<string>("all");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    mux_playback_id: '',
    mux_asset_id: '',
    course_id: '',
    duration_minutes: 10,
    status: 'draft' as 'published' | 'draft',
    order_index: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .order('title');

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      let query = supabase
        .from('lessons')
        .select('*, courses(title)')
        .order('course_id')
        .order('order_index');

      const { data: lessonsData, error: lessonsError } = await query;

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime Subscription para atualizar status do vídeo automaticamente
    const channel = supabase
      .channel('lessons_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons'
        },
        (payload) => {
          console.log('🔄 Realtime update recebido:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);



  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      thumbnail_url: '',
      mux_playback_id: '',
      mux_asset_id: '',
      course_id: courses[0]?.id || '',
      duration_minutes: 10,
      status: 'draft',
      order_index: 0
    });
    setEditingLesson(null);
    setUploadProgress(0);
  };

  const handleOpenDialog = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData({
        title: lesson.title,
        description: lesson.description || '',
        thumbnail_url: lesson.thumbnail_url || '',
        mux_playback_id: lesson.mux_playback_id || '',
        mux_asset_id: lesson.mux_asset_id || '',
        course_id: lesson.course_id,
        duration_minutes: Math.round((lesson.duration_seconds || 0) / 60),
        status: lesson.is_published ? 'published' : 'draft',
        order_index: lesson.order_index
      });
    } else {
      resetForm();
      if (courses.length > 0) {
        setFormData(prev => ({ ...prev, course_id: courses[0].id }));
      }
    }
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lesson-thumbnails')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('lesson-thumbnails')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      toast.success('Thumbnail carregada com sucesso!');
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setUploadProgress(0);

    try {
      // 1. Get Upload URL from our API
      const response = await api.post('/api/video/upload-url');
      console.log('DEBUG: API Response:', response.data);

      const { uploadUrl, assetId, uploadId } = response.data;

      // Mux pode não retornar assetId imediatamente no Direct Upload, mas retorna uploadId
      const finalId = assetId || uploadId;

      if (!finalId) {
        console.error('DEBUG: Both assetId and uploadId are MISSING!');
        toast.error('Erro: ID do vídeo não retornado pela API.');
        setUploadingVideo(false);
        return;
      }

      console.log('DEBUG: ID to use (asset or upload):', finalId);

      // 2. Upload directly to Mux
      // Using XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('DEBUG: Upload finished. Setting formData.mux_asset_id to:', finalId);
          setFormData(prev => {
            const newState = { ...prev, mux_asset_id: finalId };
            console.log('DEBUG: New FormData State:', newState);
            return newState;
          });
          // setVideoId removido pois não existe e causava erro
          toast.success('Vídeo enviado para processamento!');
          toast.info('O vídeo estará disponível em alguns minutos.');
          setUploadingVideo(false);
        } else {
          toast.error('Falha no upload para o Mux');
          setUploadingVideo(false);
        }
      };

      xhr.onerror = () => {
        toast.error('Erro de rede durante o upload');
        setUploadingVideo(false);
      };

      xhr.send(file);
    } catch (error: any) {
      toast.error('Erro ao iniciar upload: ' + error.message);
      setUploadingVideo(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("Título da aula é obrigatório");
      return;
    }
    if (!formData.course_id) {
      toast.error("Selecione um curso");
      return;
    }

    setSaving(true);
    try {
      console.log('DEBUG: handleSave formData:', formData); // DEBUG LEITURA

      const lessonData = {
        title: formData.title,
        description: formData.description,
        thumbnail_url: formData.thumbnail_url,
        course_id: formData.course_id,
        duration_seconds: formData.duration_minutes * 60,
        order_index: formData.order_index,
        is_published: formData.status === 'published',
        mux_playback_id: formData.mux_playback_id,
        mux_asset_id: formData.mux_asset_id
      };

      console.log('DEBUG: lessonData to save:', lessonData); // DEBUG PAYLOAD

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id);

        if (error) throw error;
        toast.success("Aula atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert(lessonData);

        if (error) throw error;
        toast.success("Aula criada com sucesso!");
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

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast.success("Aula removida!");
      setLessons(lessons.filter(l => l.id !== deleteId));
      setDeleteId(null);
    } catch (error: any) {
      toast.error('Erro ao remover: ' + error.message);
    }
  };

  const handleSync = async (lesson: any) => {
    if (!lesson.mux_asset_id) return;
    const toastId = toast.loading('Sincronizando...');
    try {
      const { data } = await api.post(`/api/video/sync/${lesson.mux_asset_id}`);
      if (data.success) {
        toast.success('Status sincronizado!', { id: toastId });
        fetchData();
      } else {
        toast.error('Erro: ' + (data.error || 'Desconhecido'), { id: toastId });
      }
    } catch (e: any) {
      toast.error('Erro de conexão: ' + e.message, { id: toastId });
    }
  };

  const filteredLessons = filterCourse === "all"
    ? lessons
    : lessons.filter(l => l.course_id === filterCourse);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Aulas</h1>
          <p className="text-slate-600 mt-1">Gerencie o conteúdo das aulas ({lessons.length} total)</p>
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
                Novo Aula
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>
                  {editingLesson ? 'Editar Aula' : 'Nova Aula'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                {/* Course Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Curso *</Label>
                    <Select
                      value={formData.course_id}
                      onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>Título da Aula *</Label>
                    <Input
                      placeholder="Ex: Introdução ao React"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Duração (min)</Label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ordem</Label>
                    <Input
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
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
                    placeholder="Descrição do conteúdo da aula..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Thumbnail</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-16 bg-slate-100 rounded border overflow-hidden flex-shrink-0">
                      {formData.thumbnail_url ? (
                        <img src={formData.thumbnail_url} alt="Capa" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={imageInputRef}
                        onChange={handleImageUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingImage}
                        onClick={() => imageInputRef.current?.click()}
                      >
                        {uploadingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Carregar Thumbnail
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vídeo da Aula</Label>
                  <div className="border rounded-lg p-4 bg-slate-50">
                    {uploadingVideo ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Enviando vídeo...</span>
                          <span className="font-medium">{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Mux Playback ID (preenchido automaticamente)"
                            value={formData.mux_playback_id}
                            onChange={(e) => setFormData({ ...formData, mux_playback_id: e.target.value })}
                            className="font-mono text-xs"
                          />
                          <Input
                            placeholder="Mux Asset ID"
                            value={formData.mux_asset_id}
                            readOnly
                            className="font-mono text-xs w-32 bg-slate-100"
                          />
                        </div>

                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          ref={videoInputRef}
                          onChange={handleVideoUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => videoInputRef.current?.click()}
                          className="w-full"
                        >
                          <FileVideo className="w-4 h-4 mr-2" />
                          Selecionar Vídeo para Upload
                        </Button>
                        <p className="text-xs text-slate-500">
                          O vídeo será enviado diretamente para o Mux e processado automaticamente.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Preview */}
                {formData.mux_playback_id && (
                  <div className="mt-4">
                    <Label>Preview do Vídeo</Label>
                    <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 mt-2 bg-black">
                      <MuxPlayer
                        streamType="on-demand"
                        playbackId={formData.mux_playback_id}
                        // tokens removido pois o asset é público
                        metadata={{
                          video_id: formData.mux_asset_id,
                          video_title: formData.title,
                          viewer_user_id: "admin",
                        }}
                        primaryColor="#0ea5e9"
                        secondaryColor="#ffffff"
                        style={{ height: '100%', width: '100%' }}
                      />
                    </div>
                  </div>
                )}

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
                    disabled={saving || uploadingVideo || uploadingImage}
                    className="flex-1 bg-sky-500 hover:bg-sky-600"
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingLesson ? 'Salvar Alterações' : 'Criar Aula'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Button
          variant={filterCourse === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterCourse('all')}
          className={filterCourse === 'all' ? 'bg-sky-600' : ''}
          size="sm"
        >
          Todas
        </Button>
        {courses.map(course => (
          <Button
            key={course.id}
            variant={filterCourse === course.id ? 'default' : 'outline'}
            onClick={() => setFilterCourse(course.id)}
            className={filterCourse === course.id ? 'bg-sky-600' : ''}
            size="sm"
          >
            {course.title}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="overflow-hidden bg-white hover:shadow-lg transition-shadow group flex flex-col">
              <div className="aspect-video bg-slate-100 relative group-hover:bg-slate-200 transition-colors">
                {lesson.thumbnail_url ? (
                  <img
                    src={lesson.thumbnail_url}
                    alt={lesson.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Video className="w-12 h-12" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-12 h-12 text-white fill-current" />
                </div>

                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.round((lesson.duration_seconds || 0) / 60)} min
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="mb-2">
                  <span className="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded-full">
                    {lesson.courses?.title || 'Sem curso'}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 line-clamp-1">{lesson.title}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">
                  {lesson.description || 'Sem descrição'}
                </p>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(lesson)}
                    >
                      <Pencil className="w-4 h-4 text-slate-600" />
                    </Button>
                    {(lesson.mux_status === 'pending' || !lesson.mux_playback_id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(lesson)}
                        title="Sincronizar Status do Vídeo"
                      >
                        <RefreshCw className="w-4 h-4 text-orange-500" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(lesson.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${lesson.is_published
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {lesson.is_published ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
          {filteredLessons.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              Nenhuma aula encontrada.
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aula?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A aula será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
