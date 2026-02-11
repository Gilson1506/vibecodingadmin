import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Video, User, Briefcase, Star, BookOpen, DollarSign,
    Plus, Trash2, Loader2, Save, Upload, CheckCircle,
    Image as ImageIcon, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Course {
    id: string;
    title: string;
    price_cents: number;
    has_config: boolean;
    is_active_checkout: boolean;
}

interface Lesson {
    id: string;
    title: string;
    description?: string;
    duration_minutes: number;
    order_index: number;
    thumbnail_url?: string;
}

interface PortfolioProject {
    title: string;
    description: string;
    image_url: string; // Main image (backward compatibility)
    images?: string[]; // Up to 4 images
    project_url: string;
}

interface Benefit {
    icon: string;
    title: string;
    description: string;
}

interface CheckoutConfig {
    id?: string;
    course_id: string;
    is_active: boolean;
    mux_playback_id?: string;
    mux_asset_id?: string;
    video_title?: string;
    instructor_name?: string;
    instructor_title?: string;
    instructor_bio?: string;
    instructor_image?: string;
    instructor_years_experience?: number;
    instructor_students_count?: number;
    instructor_projects_count?: number;
    portfolio_projects: PortfolioProject[];
    benefits: Benefit[];
    lesson_covers: Record<string, string>;
    price_display?: string;
    price_subtitle?: string;
    price_features: string[];
    whatsapp_number?: string;
}

const defaultConfig: CheckoutConfig = {
    course_id: '',
    is_active: false,
    portfolio_projects: [],
    benefits: [],
    lesson_covers: {},
    price_features: [],
};

const iconOptions = [
    { value: 'BookOpen', label: 'Livro' },
    { value: 'Users', label: 'Usuários' },
    { value: 'Zap', label: 'Raio' },
    { value: 'Award', label: 'Prêmio' },
    { value: 'CheckCircle', label: 'Check' },
    { value: 'Play', label: 'Play' },
    { value: 'Star', label: 'Estrela' },
    { value: 'Heart', label: 'Coração' },
];

export default function CheckoutSettings() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [config, setConfig] = useState<CheckoutConfig>(defaultConfig);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingInstructorImage, setUploadingInstructorImage] = useState(false);
    const [uploadingPortfolioImage, setUploadingPortfolioImage] = useState<number | null>(null);

    const instructorImageRef = useRef<HTMLInputElement>(null);

    // Load courses
    useEffect(() => {
        loadCourses();
    }, []);

    // Load config when course changes
    useEffect(() => {
        if (selectedCourseId) {
            loadConfig(selectedCourseId);
        }
    }, [selectedCourseId]);

    const loadCourses = async () => {
        try {
            const { data, error } = await supabase.rpc('get_courses_for_checkout');
            if (error) throw error;
            setCourses(data || []);
            if (data?.length > 0) {
                const activeCourse = data.find((c: Course) => c.is_active_checkout);
                setSelectedCourseId(activeCourse?.id || data[0].id);
            }
        } catch (error: any) {
            toast.error('Erro ao carregar cursos: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadConfig = async (courseId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_checkout_config', { p_course_id: courseId });

            if (error) throw error;

            if (data?.config) {
                setConfig({
                    ...defaultConfig,
                    ...data.config,
                    portfolio_projects: data.config.portfolio_projects || [],
                    benefits: data.config.benefits || [],
                    lesson_covers: data.config.lesson_covers || {},
                    price_features: data.config.price_features || [],
                });
            } else {
                setConfig({ ...defaultConfig, course_id: courseId });
            }

            // Load lessons with full data
            const lessonsData = data?.lessons || [];
            setLessons(lessonsData);

        } catch (error: any) {
            toast.error('Erro ao carregar configuração: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Upload image to Supabase Storage
    const uploadImage = async (file: File, folder: string): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('checkout-assets')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('checkout-assets')
                .getPublicUrl(fileName);

            return data.publicUrl;
        } catch (error: any) {
            toast.error('Erro no upload: ' + error.message);
            return null;
        }
    };

    // Instructor image upload handler
    const handleInstructorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingInstructorImage(true);
        const url = await uploadImage(file, 'instructor');
        if (url) {
            setConfig(prev => ({ ...prev, instructor_image: url }));
            toast.success('Imagem do instrutor enviada!');
        }
        setUploadingInstructorImage(false);
    };

    // Portfolio image upload handler - supports up to 4 images per project
    const handlePortfolioImageUpload = async (projectIndex: number, imageSlot: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPortfolioImage(projectIndex * 10 + imageSlot); // Unique ID for each slot
        const url = await uploadImage(file, 'portfolio');
        if (url) {
            setConfig(prev => ({
                ...prev,
                portfolio_projects: prev.portfolio_projects.map((p, i) => {
                    if (i !== projectIndex) return p;
                    const newImages = [...(p.images || [])];
                    newImages[imageSlot] = url;
                    // Also set first image as image_url for backward compatibility
                    return {
                        ...p,
                        images: newImages,
                        image_url: newImages[0] || p.image_url
                    };
                })
            }));
            toast.success('Imagem enviada!');
        }
        setUploadingPortfolioImage(null);
    };

    // Remove a specific image from project
    const removePortfolioImage = (projectIndex: number, imageSlot: number) => {
        setConfig(prev => ({
            ...prev,
            portfolio_projects: prev.portfolio_projects.map((p, i) => {
                if (i !== projectIndex) return p;
                const newImages = [...(p.images || [])];
                newImages.splice(imageSlot, 1);
                return {
                    ...p,
                    images: newImages,
                    image_url: newImages[0] || ''
                };
            })
        }));
    };

    const handleSave = async () => {
        if (!selectedCourseId) {
            toast.error('Selecione um curso');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.rpc('upsert_checkout_config', {
                p_course_id: selectedCourseId,
                p_is_active: config.is_active,
                p_mux_playback_id: config.mux_playback_id || null,
                p_mux_asset_id: config.mux_asset_id || null,
                p_video_title: config.video_title || null,
                p_instructor_name: config.instructor_name || null,
                p_instructor_title: config.instructor_title || null,
                p_instructor_bio: config.instructor_bio || null,
                p_instructor_image: config.instructor_image || null,
                p_instructor_years_experience: config.instructor_years_experience || 0,
                p_instructor_students_count: config.instructor_students_count || 0,
                p_instructor_projects_count: config.instructor_projects_count || 0,
                p_portfolio_projects: config.portfolio_projects,
                p_benefits: config.benefits,
                p_lesson_covers: config.lesson_covers,
                p_price_display: config.price_display || null,
                p_price_subtitle: config.price_subtitle || null,
                p_price_features: config.price_features,
                p_whatsapp_number: config.whatsapp_number || null,
            });

            if (error) throw error;
            toast.success('Configuração salva com sucesso!');
            loadCourses();
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Video upload handler
    const handleVideoUpload = async (file: File) => {
        setUploading(true);
        try {
            const urlRes = await fetch(`${API_URL}/api/mux/upload-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ corsOrigin: window.location.origin })
            });
            const urlData = await urlRes.json();

            if (!urlData.success) throw new Error('Failed to get upload URL');

            toast.info('Enviando vídeo para Mux...');
            await fetch(urlData.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': 'video/*' }
            });

            toast.info('Processando vídeo...');

            let attempts = 0;
            const maxAttempts = 30;

            const checkStatus = async (): Promise<void> => {
                attempts++;
                const statusRes = await fetch(`${API_URL}/api/mux/asset/${urlData.uploadId}`);
                const statusData = await statusRes.json();

                if (statusData.playbackId) {
                    setConfig(prev => ({
                        ...prev,
                        mux_playback_id: statusData.playbackId,
                        mux_asset_id: statusData.assetId
                    }));
                    toast.success('Vídeo processado com sucesso!');
                    return;
                }

                if (attempts < maxAttempts) {
                    await new Promise(r => setTimeout(r, 3000));
                    return checkStatus();
                } else {
                    throw new Error('Timeout processing video');
                }
            };

            await checkStatus();

        } catch (error: any) {
            toast.error('Erro no upload: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Portfolio handlers
    const addPortfolioProject = () => {
        setConfig(prev => ({
            ...prev,
            portfolio_projects: [...prev.portfolio_projects, { title: '', description: '', image_url: '', images: [], project_url: '' }]
        }));
    };

    const updatePortfolioProject = (index: number, field: keyof PortfolioProject, value: string) => {
        setConfig(prev => ({
            ...prev,
            portfolio_projects: prev.portfolio_projects.map((p, i) =>
                i === index ? { ...p, [field]: value } : p
            )
        }));
    };

    const removePortfolioProject = (index: number) => {
        setConfig(prev => ({
            ...prev,
            portfolio_projects: prev.portfolio_projects.filter((_, i) => i !== index)
        }));
    };

    // Benefits handlers
    const addBenefit = () => {
        setConfig(prev => ({
            ...prev,
            benefits: [...prev.benefits, { icon: 'Star', title: '', description: '' }]
        }));
    };

    const updateBenefit = (index: number, field: keyof Benefit, value: string) => {
        setConfig(prev => ({
            ...prev,
            benefits: prev.benefits.map((b, i) =>
                i === index ? { ...b, [field]: value } : b
            )
        }));
    };

    const removeBenefit = (index: number) => {
        setConfig(prev => ({
            ...prev,
            benefits: prev.benefits.filter((_, i) => i !== index)
        }));
    };

    // Price features handlers
    const addPriceFeature = () => {
        setConfig(prev => ({
            ...prev,
            price_features: [...prev.price_features, '']
        }));
    };

    const updatePriceFeature = (index: number, value: string) => {
        setConfig(prev => ({
            ...prev,
            price_features: prev.price_features.map((f, i) => i === index ? value : f)
        }));
    };

    const removePriceFeature = (index: number) => {
        setConfig(prev => ({
            ...prev,
            price_features: prev.price_features.filter((_, i) => i !== index)
        }));
    };

    if (loading && !selectedCourseId) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Configurações do Checkout</h1>
                    <p className="text-slate-600 mt-1">Configure a página de vendas do curso</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-sky-600 hover:bg-sky-700">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar Configuração
                </Button>
            </div>

            {/* Course Selector */}
            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <Label className="whitespace-nowrap font-semibold">Curso:</Label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Selecione um curso" />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map(course => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.title} {course.is_active_checkout && '(Ativo)'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 ml-auto">
                        <input
                            type="checkbox"
                            checked={config.is_active}
                            onChange={(e) => setConfig(prev => ({ ...prev, is_active: e.target.checked }))}
                            className="rounded"
                        />
                        <span className="text-sm font-medium">Checkout Ativo</span>
                    </label>
                </div>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="video" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="video"><Video className="w-4 h-4 mr-1" /> Vídeo</TabsTrigger>
                    <TabsTrigger value="instructor"><User className="w-4 h-4 mr-1" /> Instrutor</TabsTrigger>
                    <TabsTrigger value="portfolio"><Briefcase className="w-4 h-4 mr-1" /> Portfólio</TabsTrigger>
                    <TabsTrigger value="benefits"><Star className="w-4 h-4 mr-1" /> Benefícios</TabsTrigger>
                    <TabsTrigger value="content"><BookOpen className="w-4 h-4 mr-1" /> Conteúdo</TabsTrigger>
                    <TabsTrigger value="pricing"><DollarSign className="w-4 h-4 mr-1" /> Preço</TabsTrigger>
                </TabsList>

                {/* Video Tab */}
                <TabsContent value="video">
                    <Card className="p-6 space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Video className="w-5 h-5 text-sky-600" />
                            Vídeo Principal (Mux)
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <Label>Título do Vídeo</Label>
                                <Input
                                    value={config.video_title || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, video_title: e.target.value }))}
                                    placeholder="Resumo do Curso"
                                />
                            </div>

                            {config.mux_playback_id ? (
                                <div className="space-y-2">
                                    <Label>Preview do Vídeo</Label>
                                    <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                                        <iframe
                                            src={`https://stream.mux.com/${config.mux_playback_id}.m3u8`}
                                            className="w-full h-full"
                                            allowFullScreen
                                        />
                                    </div>
                                    <p className="text-sm text-green-600 flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" /> Playback ID: {config.mux_playback_id}
                                    </p>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                                    <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                                    <p className="text-slate-600 mb-4">Arraste um vídeo ou clique para fazer upload</p>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                                        className="hidden"
                                        id="video-upload"
                                        disabled={uploading}
                                    />
                                    <Button asChild disabled={uploading}>
                                        <label htmlFor="video-upload" className="cursor-pointer">
                                            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                            {uploading ? 'Enviando...' : 'Selecionar Vídeo'}
                                        </label>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                {/* Instructor Tab */}
                <TabsContent value="instructor">
                    <Card className="p-6 space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <User className="w-5 h-5 text-sky-600" />
                            Dados do Instrutor
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Nome</Label>
                                <Input
                                    value={config.instructor_name || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, instructor_name: e.target.value }))}
                                    placeholder="João Silva"
                                />
                            </div>
                            <div>
                                <Label>Título/Cargo</Label>
                                <Input
                                    value={config.instructor_title || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, instructor_title: e.target.value }))}
                                    placeholder="Full Stack Developer"
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="md:col-span-2">
                                <Label>Foto do Instrutor</Label>
                                <div className="flex items-start gap-4 mt-2">
                                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
                                        {config.instructor_image ? (
                                            <img src={config.instructor_image} alt="Instrutor" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <input
                                            ref={instructorImageRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleInstructorImageUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => instructorImageRef.current?.click()}
                                            disabled={uploadingInstructorImage}
                                        >
                                            {uploadingInstructorImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                            {uploadingInstructorImage ? 'Enviando...' : 'Fazer Upload'}
                                        </Button>
                                        <p className="text-xs text-slate-500">PNG, JPG até 2MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <Label>Biografia</Label>
                                <textarea
                                    value={config.instructor_bio || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, instructor_bio: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    rows={4}
                                    placeholder="Experiência e história do instrutor..."
                                />
                            </div>
                            <div>
                                <Label>Anos de Experiência</Label>
                                <Input
                                    type="number"
                                    value={config.instructor_years_experience || 0}
                                    onChange={(e) => setConfig(prev => ({ ...prev, instructor_years_experience: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                            <div>
                                <Label>Número de Alunos</Label>
                                <Input
                                    type="number"
                                    value={config.instructor_students_count || 0}
                                    onChange={(e) => setConfig(prev => ({ ...prev, instructor_students_count: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                            <div>
                                <Label>Projetos Realizados</Label>
                                <Input
                                    type="number"
                                    value={config.instructor_projects_count || 0}
                                    onChange={(e) => setConfig(prev => ({ ...prev, instructor_projects_count: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* Portfolio Tab */}
                <TabsContent value="portfolio">
                    <Card className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-sky-600" />
                                Projetos do Portfólio
                            </h2>
                            <Button onClick={addPortfolioProject} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-1" /> Adicionar Projeto
                            </Button>
                        </div>

                        {config.portfolio_projects.map((project, index) => (
                            <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-700">Projeto {index + 1}</span>
                                    <Button variant="ghost" size="sm" onClick={() => removePortfolioProject(index)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>

                                {/* Multi Image Upload - 4 slots */}
                                <div>
                                    <Label>Imagens do Projeto (até 4)</Label>
                                    <div className="grid grid-cols-4 gap-2 mt-2">
                                        {[0, 1, 2, 3].map((slot) => {
                                            const images = project.images || [];
                                            const imageUrl = images[slot];
                                            const uploadId = index * 10 + slot;
                                            const isUploading = uploadingPortfolioImage === uploadId;

                                            return (
                                                <div key={slot} className="relative aspect-video rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 group">
                                                    {imageUrl ? (
                                                        <>
                                                            <img src={imageUrl} alt={`${project.title} ${slot + 1}`} className="w-full h-full object-cover" />
                                                            <button
                                                                onClick={() => removePortfolioImage(index, slot)}
                                                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => handlePortfolioImageUpload(index, slot, e)}
                                                                className="hidden"
                                                                disabled={isUploading}
                                                            />
                                                            {isUploading ? (
                                                                <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Plus className="w-5 h-5 text-slate-400" />
                                                                    <span className="text-[10px] text-slate-400 mt-1">{slot + 1}</span>
                                                                </>
                                                            )}
                                                        </label>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <Label>Título</Label>
                                        <Input
                                            value={project.title}
                                            onChange={(e) => updatePortfolioProject(index, 'title', e.target.value)}
                                            placeholder="Nome do projeto"
                                        />
                                    </div>
                                    <div>
                                        <Label>URL do Projeto</Label>
                                        <Input
                                            value={project.project_url}
                                            onChange={(e) => updatePortfolioProject(index, 'project_url', e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Descrição</Label>
                                        <textarea
                                            value={project.description}
                                            onChange={(e) => updatePortfolioProject(index, 'description', e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>

                        ))}

                        {config.portfolio_projects.length === 0 && (
                            <p className="text-center text-slate-500 py-8">Nenhum projeto adicionado ainda</p>
                        )}
                    </Card>
                </TabsContent>

                {/* Benefits Tab */}
                <TabsContent value="benefits">
                    <Card className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Star className="w-5 h-5 text-sky-600" />
                                Por que escolher o curso
                            </h2>
                            <Button onClick={addBenefit} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-1" /> Adicionar Benefício
                            </Button>
                        </div>

                        {config.benefits.map((benefit, index) => (
                            <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-700">Benefício {index + 1}</span>
                                    <Button variant="ghost" size="sm" onClick={() => removeBenefit(index)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                                <div className="grid md:grid-cols-3 gap-3">
                                    <div>
                                        <Label>Ícone</Label>
                                        <Select value={benefit.icon} onValueChange={(v) => updateBenefit(index, 'icon', v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {iconOptions.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>Título</Label>
                                        <Input
                                            value={benefit.title}
                                            onChange={(e) => updateBenefit(index, 'title', e.target.value)}
                                            placeholder="15 Aulas Completas"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <Label>Descrição</Label>
                                        <Input
                                            value={benefit.description}
                                            onChange={(e) => updateBenefit(index, 'description', e.target.value)}
                                            placeholder="Conteúdo estruturado do zero até deploy"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {config.benefits.length === 0 && (
                            <p className="text-center text-slate-500 py-8">Nenhum benefício adicionado ainda</p>
                        )}
                    </Card>
                </TabsContent>

                {/* Content Tab - Shows lessons with their existing data */}
                <TabsContent value="content">
                    <Card className="p-6 space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-sky-600" />
                            Aulas do Curso
                        </h2>
                        <p className="text-sm text-slate-500">
                            As aulas são exibidas automaticamente com a thumbnail, título e descrição cadastrados.
                            Vá em <strong>Aulas</strong> para editar.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            {lessons.map((lesson) => (
                                <div key={lesson.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="aspect-video bg-slate-100">
                                        {lesson.thumbnail_url ? (
                                            <img src={lesson.thumbnail_url} alt={lesson.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Video className="w-12 h-12 text-slate-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center font-bold text-sky-600 text-sm">
                                                {lesson.order_index}
                                            </span>
                                            <h4 className="font-semibold text-slate-800">{lesson.title}</h4>
                                        </div>
                                        <p className="text-xs text-slate-500">{lesson.duration_minutes} min</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {lessons.length === 0 && (
                            <p className="text-center text-slate-500 py-8">Este curso não tem aulas cadastradas</p>
                        )}
                    </Card>
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing">
                    <Card className="p-6 space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-sky-600" />
                            Preço e Investimento
                        </h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Preço de Exibição</Label>
                                <Input
                                    value={config.price_display || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, price_display: e.target.value }))}
                                    placeholder="60.000,00 Kz"
                                />
                            </div>
                            <div>
                                <Label>Subtítulo</Label>
                                <Input
                                    value={config.price_subtitle || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, price_subtitle: e.target.value }))}
                                    placeholder="Pagamento único, sem mensalidades"
                                />
                            </div>
                            <div>
                                <Label>WhatsApp</Label>
                                <Input
                                    value={config.whatsapp_number || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                                    placeholder="244923456789"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label>Benefícios do Preço</Label>
                                <Button onClick={addPriceFeature} variant="outline" size="sm">
                                    <Plus className="w-4 h-4 mr-1" /> Adicionar
                                </Button>
                            </div>

                            {config.price_features.map((feature, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={feature}
                                        onChange={(e) => updatePriceFeature(index, e.target.value)}
                                        placeholder="15 aulas completas"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => removePriceFeature(index)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
