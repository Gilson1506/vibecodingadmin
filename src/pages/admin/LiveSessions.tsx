import { useState, useRef, useEffect } from "react";
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
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus,
  Video,
  Calendar,
  Users,
  Pencil,
  Trash2,
  MessageCircle,
  Circle,
  Copy,
  ExternalLink,
  RefreshCw,
  Loader2,
  Radio,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { API_URL } from "@/lib/supabase";

// Types matching the Backend/Database
interface LiveSession {
  id: string;
  title: string;
  description: string;
  scheduled_at: string;
  max_participants: number;
  duration_minutes: number;
  status: 'scheduled' | 'live' | 'ended';
  mux_live_stream_id?: string;
  mux_stream_key?: string;
  mux_playback_id?: string;
  rtmp_url?: string;
  mux_status?: string; // fetched dynamically
}

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Selection
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    maxParticipants: 100,
    durationMinutes: 60
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/live/list`);
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Erro ao carregar sessões");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.scheduledAt) {
      toast.error("Preencha título e data");
      return;
    }

    setIsCreating(true);
    try {
      const response = await api.post(`/api/live/create`, {
        title: formData.title,
        description: formData.description,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        maxParticipants: Number(formData.maxParticipants),
        durationMinutes: Number(formData.durationMinutes)
      });

      toast.success("Sessão criada com integração Mux!");
      setSessions([...sessions, response.data]);
      setIsDialogOpen(false);

      // Reset form
      setFormData({
        title: "",
        description: "",
        scheduledAt: "",
        maxParticipants: 100,
        durationMinutes: 60
      });

    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Erro ao criar sessão");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta sessão?")) return;

    try {
      await api.delete(`/api/live/${id}`);
      setSessions(sessions.filter(s => s.id !== id));
      toast.success("Sessão removida");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Erro ao remover sessão");
    }
  };

  const checkStatus = async (id: string) => {
    try {
      const response = await api.get(`/api/live/${id}`);
      const updatedSession = response.data;

      setSessions(sessions.map(s => s.id === id ? updatedSession : s));
      toast.success(`Status Mux: ${updatedSession.mux_status || 'desconhecido'}`);

      if (selectedSession?.id === id) {
        setSelectedSession(updatedSession);
      }

    } catch (error) {
      toast.error("Erro ao verificar status");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sessões ao Vivo</h1>
          <p className="text-slate-600 mt-1">Gerencie transmissões ao vivo via Mux</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Transmissão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Sessão ao Vivo</DialogTitle>
              <DialogDescription>
                Isso criará uma Live Stream na Mux e gerará as chaves de transmissão.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Aula de React Hooks"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição breve do conteúdo..." rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Data e Hora de Início</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Participantes</Label>
                  <Input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={e => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                  />
                </div>
              </div>

              <Button
                onClick={handleCreate}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
                disabled={isCreating}
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Video className="w-4 h-4 mr-2" />}
                Criar Transmissão
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <Video className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-700">Nenhuma sessão agendada</h3>
          <p className="text-slate-500">Crie sua primeira transmissão ao vivo para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="p-6 hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-emerald-500">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${session.status === 'live'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-emerald-100 text-emerald-600'
                    }`}>
                    {session.status === 'live' ? (
                      <Radio className="w-6 h-6 animate-pulse" />
                    ) : (
                      <Calendar className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-lg">{session.title}</h3>
                      {session.status === 'live' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse font-bold">
                          <Circle className="w-2 h-2 fill-current" />
                          AO VIVO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {session.status.toUpperCase()}
                        </span>
                      )}
                      {session.mux_status && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-blue-50 text-blue-600 border border-blue-100">
                          MUX: {session.mux_status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2 mt-1 max-w-xl">{session.description}</p>

                    <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatTime(session.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 cursor-pointer hover:text-emerald-500" onClick={() => checkStatus(session.id)} />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSession(session);
                      setIsDebugOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Dados de Transmissão
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(session.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Connection Details Modal */}
      <Dialog open={isDebugOpen} onOpenChange={setIsDebugOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuração de Transmissão (OBS Studio)</DialogTitle>
            <DialogDescription>
              Copie estes dados para o seu software de transmissão (OBS, Wirecast, vMix).
              <br />
              <span className="text-red-500 font-bold">NUNCA compartilhe sua Chave de Transmissão!</span>
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-6 py-4">

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase">Servidor RTMP (URL)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input readOnly value={selectedSession.rtmp_url || 'rtmps://global-live.mux.com:443/app'} className="font-mono bg-white" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(selectedSession.rtmp_url || 'rtmps://global-live.mux.com:443/app')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase">Chave de Transmissão (Stream Key)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input type="password" readOnly value={selectedSession.mux_stream_key || ''} className="font-mono bg-white" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(selectedSession.mux_stream_key || '')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    No OBS: Configurações {'>'} Transmissão {'>'} Serviço: Personalizado
                  </p>
                </div>
              </div>

              <div className="w-full h-px bg-slate-200" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-500 mb-1 block">ID PÚBLICO (Playback ID)</Label>
                  <code className="block bg-slate-100 p-2 rounded text-xs select-all">
                    {selectedSession.mux_playback_id || 'Pendente'}
                  </code>
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-500 mb-1 block">ID MUX (Interno)</Label>
                  <code className="block bg-slate-100 p-2 rounded text-xs select-all">
                    {selectedSession.mux_live_stream_id}
                  </code>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => checkStatus(selectedSession.id)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar Status na Mux
                </Button>
                <Button onClick={() => setIsDebugOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
