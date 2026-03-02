import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  Hash,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Image as ImageIcon,
  X,
  FileText,
  Download,
  Trash2,
  ShieldAlert,
  Plus,
  Check,
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Attachment {
  name: string;
  type: "image" | "file";
  url: string;
  size: string;
}

interface Message {
  id: string;
  text: string;
  sender: {
    name: string;
    avatar?: string;
    isMe: boolean;
    role?: string;
  };
  timestamp: string;
  attachments?: Attachment[];
}

import { supabase } from "@/lib/supabase";

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  unread?: number;
  slug: string;
}

// Messages are now fetched from DB

export default function CommunityPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newChannelName, setNewChannelName] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);

  // Fetch Channels on mount
  useEffect(() => {
    fetchChannels();
    const subscription = supabase
      .channel('public:community_channels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_channels' }, fetchChannels)
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  // Fetch Messages when activeChannel changes
  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel);

      const subscription = supabase
        .channel(`chat:${activeChannel}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `channel_id=eq.${activeChannel}`
        }, (payload) => {
          fetchMessages(activeChannel);
        })
        .subscribe();

      // Presence Channel - Monitor only (Admin doesn't need to track self necessarily, but good for consistency)
      // Actually Admin SHOULD track self so students see Admin online
      const presenceChannel = supabase.channel(`room_${activeChannel}`, {
        config: {
          presence: {
            key: user?.id,
          },
        },
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          setOnlineUsers(Object.keys(state).length);
        })
        .on('presence', { event: 'join' }, () => {
          // const state = presenceChannel.presenceState();
          // setOnlineUsers(Object.keys(state).length);
        })
        .on('presence', { event: 'leave' }, () => {
          // const state = presenceChannel.presenceState();
          // setOnlineUsers(Object.keys(state).length);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user?.id,
              name: user?.name,
              role: 'admin', // Admin specific tag?
              online_at: new Date().toISOString(),
            });
          }
        });

      return () => {
        subscription.unsubscribe();
        presenceChannel.unsubscribe();
      };
    }
  }, [activeChannel, user]);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('community_channels')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setChannels(data || []);
      if (data && data.length > 0 && !activeChannel) {
        setActiveChannel(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  };

  const fetchMessages = async (channelId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select(`
          id,
          message,
          created_at,
          attachments,
          user:users (
            full_name,
            avatar_url,
            role
          )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = data.map((msg: any) => ({
        id: msg.id,
        text: msg.message,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachments: msg.attachments || [],
        sender: {
          name: msg.user?.full_name || 'Desconhecido',
          avatar: msg.user?.avatar_url,
          role: msg.user?.role,
          isMe: false // We will check actual user later but for admin view "Me" is tricky if we don't know "my" user_id from auth context perfectly mapped. 
          // Actually useAuth gives us the user.
        }
      })).map(msg => ({
        ...msg,
        sender: {
          ...msg.sender,
          isMe: msg.sender.name === user?.name // Simple check, or better check IDs if available
        }
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChannel]);

  const handleAddChannel = async () => {
    if (!newChannelName.trim()) return;

    const slug = newChannelName.toLowerCase().replace(/\s+/g, '-');

    try {
      const { data, error } = await supabase
        .from('community_channels')
        .insert({
          name: newChannelName,
          slug: slug,
          type: 'text',
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;

      setNewChannelName("");
      setIsCreatingChannel(false);
      toast.success(`Canal #${data.name} criado com sucesso!`);
      // fetchChannels will be triggered by realtime
    } catch (error: any) {
      toast.error('Erro ao criar canal: ' + error.message);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || !activeChannel) return;

    try {
      // Need user ID. If useAuth user object doesn't have ID, we have a problem.
      // Assuming user object from useAuth has id or we can get it from session.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Erro de autenticação");
        return;
      }

      const newMessageData = {
        channel_id: activeChannel,
        user_id: session.user.id,
        message: inputValue,
        attachments: attachments // Store as JSONB
      };

      const { error } = await supabase
        .from('community_messages')
        .insert(newMessageData);

      if (error) throw error;

      setInputValue("");
      setAttachments([]);
      // fetchMessages will be triggered by realtime
    } catch (error: any) {
      toast.error("Erro ao enviar mensagem: " + error.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const attachment: Attachment = {
          name: file.name,
          type: type,
          url: event.target?.result as string,
          size: formatFileSize(file.size),
        };
        setAttachments([...attachments, attachment]);
        toast.success(`${type === "image" ? "Imagem" : "Arquivo"} adicionado!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('community_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      toast.success("Mensagem removida por um administrador.");
      fetchMessages(activeChannel!);
    } catch (error: any) {
      toast.error("Erro ao apagar mensagem: " + error.message);
    }
  };

  const handleBanUser = (userName: string) => {
    toast.error(`Usuário ${userName} banido do chat.`);
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.32))] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Channels Sidebar */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-slate-700">Canais</h2>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 border-sky-200"
              onClick={() => setIsCreatingChannel(!isCreatingChannel)}
              title="Criar novo canal"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {isCreatingChannel && (
            <div className="mb-2 flex items-center gap-1 animate-in slide-in-from-top-2 duration-200">
              <Input
                autoFocus
                className="h-8 text-xs bg-white"
                placeholder="Nome do canal..."
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
              />
              <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white shrink-0" onClick={handleAddChannel}>
                <Check className="w-3 h-3" />
              </Button>
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-8 h-8 text-sm bg-white border-slate-200" placeholder="Buscar canal..." />
          </div>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="space-y-1">
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeChannel === channel.id
                  ? 'bg-sky-100 text-sky-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 opacity-50" />
                  <span>{channel.name}</span>
                </div>
                {channel.unread && (
                  <span className="bg-sky-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {channel.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-slate-400" />
            <div>
              <h3 className="font-bold text-slate-800">
                {channels.find(c => c.id === activeChannel)?.name}
              </h3>
              <p className="text-xs text-slate-500 hidden sm:flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {onlineUsers} Online • Admin Mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Admin Mode
            </div>

            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 scroll-smooth"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.sender.isMe ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="h-10 w-10 border border-slate-200 shadow-sm shrink-0">
                <AvatarImage src={msg.sender.avatar} />
                <AvatarFallback className={`${msg.sender.isMe ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {msg.sender.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className={`flex flex-col max-w-[80%] ${msg.sender.isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-900">
                    {msg.sender.name}
                    {msg.sender.role === 'admin' && <span className="ml-1 text-[10px] bg-sky-100 text-sky-700 px-1 py-0.5 rounded">MOD</span>}
                  </span>
                  <span className="text-xs text-slate-400">
                    {msg.timestamp}
                  </span>
                  {/* Admin Controls for other users' messages */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-4 w-4 text-slate-300 hover:text-slate-500 opacity-100 transition-opacity">
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="text-red-600 focus:text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Apagar Mensagem
                      </DropdownMenuItem>
                      {!msg.sender.isMe && (
                        <DropdownMenuItem onClick={() => handleBanUser(msg.sender.name)} className="text-amber-600 focus:text-amber-600">
                          <ShieldAlert className="w-4 h-4 mr-2" />
                          Banir Usuário
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className={`px-4 py-2 rounded-2xl shadow-sm ${msg.sender.isMe
                  ? 'bg-sky-500 text-white rounded-tr-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Attachments Display */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className={`mt-2 space-y-1 ${msg.sender.isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {msg.attachments.map((att, idx) => (
                      <div key={idx} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                        {att.type === 'image' ? (
                          <img src={att.url} alt={att.name} className="max-w-[200px] max-h-[200px] object-cover" />
                        ) : (
                          <div className="flex items-center gap-3 p-2 bg-slate-50 max-w-[200px]">
                            {att.name.endsWith('.webm') ? (
                              <audio controls src={att.url} className="w-full min-w-[200px]" />
                            ) : (
                              <>
                                <FileText className="w-8 h-8 text-sky-500 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate text-slate-700">{att.name}</p>
                                  <p className="text-[10px] text-slate-400">{att.size}</p>
                                </div>
                                <Download className="w-4 h-4 text-slate-400 ml-2" />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          {/* Attachments Preview in Input */}
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
              {attachments.map((att, index) => (
                <div key={index} className="relative group shrink-0">
                  {att.type === 'image' ? (
                    <img src={att.url} alt={att.name} className="w-12 h-12 rounded object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center border">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-400 transition-all">
            <div className="flex gap-1 pb-1">
              <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'image')}
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileUpload(e, 'file')}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-full"
                onClick={() => wrapperInputRefClick(imageInputRef)}
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-full"
                onClick={() => wrapperInputRefClick(fileInputRef)}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            </div>

            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Mensagem para #${channels.find(c => c.id === activeChannel)?.name}...`}
              className="flex-1 max-h-32 min-h-[40px] bg-transparent border-0 focus:ring-0 p-2 text-sm resize-none text-slate-900 placeholder:text-slate-400"
              rows={1}
            />

            <Button
              size="icon"
              className={`h-9 w-9 mb-0.5 transition-all ${inputValue.trim() || attachments.length > 0
                ? 'bg-sky-500 hover:bg-sky-600 text-white'
                : 'bg-slate-200 text-slate-400'
                }`}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() && attachments.length === 0}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  function wrapperInputRefClick(ref: React.RefObject<HTMLInputElement | null>) {
    ref.current?.click();
  }
}
