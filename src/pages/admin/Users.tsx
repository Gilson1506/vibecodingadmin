import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Mail, Calendar, Pencil, Trash2, Shield, ShieldCheck, Loader2, CheckCircle, XCircle, RefreshCw, BookOpen, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'student' | 'admin';
  has_access: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Enrollment states
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [userEnrollments, setUserEnrollments] = useState<string[]>([]);
  const [userProjectPurchases, setUserProjectPurchases] = useState<string[]>([]);
  const [availableCourses, setAvailableCourses] = useState<{ id: string, title: string }[]>([]);
  const [availableProjects, setAvailableProjects] = useState<{ id: string, title: string }[]>([]);

  // Fetch users from Supabase
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data: courses } = await supabase.from('courses').select('id, title').eq('is_published', true);
      setAvailableCourses(courses || []);
      const { data: projects } = await supabase.from('projects').select('id, title').eq('is_published', true);
      setAvailableProjects(projects || []);
    } catch (error) {
      console.error("Erro ao buscar cursos/projetos:", error);
    }
  };

  const fetchUserEnrollments = async (userId: string) => {
    try {
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('user_id', userId);
      setUserEnrollments(enrollments?.map(e => e.course_id) || []);

      const { data: purchases } = await supabase.from('project_purchases').select('project_id').eq('user_id', userId);
      setUserProjectPurchases(purchases?.map(p => p.project_id) || []);
    } catch (error) {
      console.error("Erro ao buscar matrículas do usuário:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  // Filter users by search term
  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create new user
  const handleCreate = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setSaving(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user?.id,
          email: newUser.email,
          full_name: newUser.name,
          role: 'student',
          has_access: false
        });

      if (profileError) throw profileError;

      toast.success('Usuário criado com sucesso!');
      setIsDialogOpen(false);
      setNewUser({ name: '', email: '', password: '' });
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro ao criar usuário: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Update user
  const handleUpdate = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editingUser.full_name,
          role: editingUser.role,
          has_access: editingUser.has_access
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success('Usuário atualizado!');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro ao atualizar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle global access
  const toggleAccess = async (user: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ has_access: !user.has_access })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(user.has_access ? 'Acesso removido' : 'Acesso concedido');
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    }
  };

  // Delete user
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(id);
      if (error) throw error;

      toast.success('Usuário excluído!');
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const handleEnrollmentToggle = async (courseId: string) => {
    if (!editingUser) return;
    const isEnrolled = userEnrollments.includes(courseId);
    try {
      if (isEnrolled) {
        await supabase.from('enrollments').delete().eq('user_id', editingUser.id).eq('course_id', courseId);
        setUserEnrollments(prev => prev.filter(id => id !== courseId));
        toast.info("Matrícula removida");
      } else {
        await supabase.from('enrollments').insert({ user_id: editingUser.id, course_id: courseId });
        setUserEnrollments(prev => [...prev, courseId]);
        toast.success("Matrícula adicionada");
      }
    } catch (error: any) {
      toast.error("Erro ao gerenciar matrícula: " + error.message);
    }
  };

  const handleProjectToggle = async (projectId: string) => {
    if (!editingUser) return;
    const isPurchased = userProjectPurchases.includes(projectId);
    try {
      if (isPurchased) {
        await supabase.from('project_purchases').delete().eq('user_id', editingUser.id).eq('project_id', projectId);
        setUserProjectPurchases(prev => prev.filter(id => id !== projectId));
        toast.info("Acesso ao projeto removido");
      } else {
        await supabase.from('project_purchases').insert({ user_id: editingUser.id, project_id: projectId });
        setUserProjectPurchases(prev => [...prev, projectId]);
        toast.success("Acesso ao projeto concedido");
      }
    } catch (error: any) {
      toast.error("Erro ao gerenciar projeto: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Usuários</h1>
          <p className="text-slate-600 mt-1">Gerencie os usuários da plataforma ({users.length} total)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sky-600 hover:bg-sky-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Nome completo"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    placeholder="Senha inicial"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreate} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Criar Usuário
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
        </div>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-4 font-medium text-slate-600">Usuário</th>
                <th className="text-left p-4 font-medium text-slate-600">Email</th>
                <th className="text-left p-4 font-medium text-slate-600">Role</th>
                <th className="text-left p-4 font-medium text-slate-600">Acesso</th>
                <th className="text-left p-4 font-medium text-slate-600">Criado em</th>
                <th className="text-right p-4 font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-purple-100' : 'bg-sky-100'
                        }`}>
                        {user.role === 'admin' ? (
                          <ShieldCheck className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Users className="w-4 h-4 text-sky-600" />
                        )}
                      </div>
                      <span className="font-medium text-slate-900">{user.full_name || 'Sem nome'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-700'
                      }`}>
                      {user.role === 'admin' ? 'Admin' : 'Aluno'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleAccess(user)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${user.has_access
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                    >
                      {user.has_access ? (
                        <><CheckCircle className="w-3 h-3" /> Sim</>
                      ) : (
                        <><XCircle className="w-3 h-3" /> Não</>
                      )}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Gerenciar Acessos"
                      onClick={() => {
                        setEditingUser(user);
                        fetchUserEnrollments(user.id);
                        setIsEnrollDialogOpen(true);
                      }}
                    >
                      <GraduationCap className="w-4 h-4 text-sky-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingUser(user); setIsEditDialogOpen(true); }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editingUser.full_name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editingUser.email} disabled className="bg-slate-100" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(v) => setEditingUser({ ...editingUser, role: v as 'student' | 'admin' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Aluno</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasAccess"
                  checked={editingUser.has_access}
                  onChange={(e) => setEditingUser({ ...editingUser, has_access: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="hasAccess">Tem acesso ao conteúdo</Label>
              </div>
              <Button onClick={handleUpdate} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enrollments & Access Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Acessos</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-6 py-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-700">{editingUser.full_name}</p>
                <p className="text-xs text-slate-500">{editingUser.email}</p>
              </div>

              {/* Courses Section */}
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-slate-500">Cursos</Label>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar border rounded-lg p-2">
                  {availableCourses.map(course => (
                    <div key={course.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md transition-colors border-b last:border-0">
                      <div className="flex items-center gap-2 truncate">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium truncate">{course.title}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={userEnrollments.includes(course.id) ? "destructive" : "outline"}
                        onClick={() => handleEnrollmentToggle(course.id)}
                        className="h-7 text-xs px-3 ml-2 shrink-0"
                      >
                        {userEnrollments.includes(course.id) ? "Remover" : "Inscrever"}
                      </Button>
                    </div>
                  ))}
                  {availableCourses.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Sem cursos publicados.</p>}
                </div>
              </div>

              {/* Projects Section */}
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-slate-500">Projetos</Label>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar border rounded-lg p-2">
                  {availableProjects.map(project => (
                    <div key={project.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md transition-colors border-b last:border-0">
                      <div className="flex items-center gap-2 truncate">
                        <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium truncate">{project.title}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={userProjectPurchases.includes(project.id) ? "destructive" : "outline"}
                        onClick={() => handleProjectToggle(project.id)}
                        className="h-7 text-xs px-3 ml-2 shrink-0"
                      >
                        {userProjectPurchases.includes(project.id) ? "Remover" : "Liberar"}
                      </Button>
                    </div>
                  ))}
                  {availableProjects.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Sem projetos publicados.</p>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
