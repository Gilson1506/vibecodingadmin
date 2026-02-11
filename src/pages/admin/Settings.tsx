import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Bell, Lock, Database } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-600 mt-2">Gerencie as configurações gerais do painel administrativo</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-blue-600" />
              Configurações Gerais
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Nome da Plataforma</label>
                <Input defaultValue="Vibe Coding 1.0" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email de Suporte</label>
                <Input defaultValue="support@vibecoding.com" type="email" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">URL da Plataforma</label>
                <Input defaultValue="https://vibecoding.com" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Descrição</label>
                <textarea
                  defaultValue="Plataforma educacional completa para ensino de programação"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              <Button onClick={handleSave}>Salvar Configurações</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Configurações de Notificações
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Novos Usuários</p>
                  <p className="text-sm text-slate-600">Notificar quando novos usuários se registram</p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Denúncias de Comunidade</p>
                  <p className="text-sm text-slate-600">Notificar sobre novas denúncias</p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Erros do Sistema</p>
                  <p className="text-sm text-slate-600">Notificar sobre erros críticos</p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Relatórios Diários</p>
                  <p className="text-sm text-slate-600">Receber resumo diário de atividades</p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
              <Button onClick={handleSave}>Salvar Preferências</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Configurações de Segurança
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Expiração de Sessão (minutos)</label>
                <Input type="number" defaultValue="60" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Tentativas de Login</label>
                <Input type="number" defaultValue="5" className="mt-1" />
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Autenticação de Dois Fatores</p>
                  <p className="text-sm text-slate-600">Exigir 2FA para administradores</p>
                </div>
                <input type="checkbox" className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">Auditoria de Ações</p>
                  <p className="text-sm text-slate-600">Registrar todas as ações de admin</p>
                </div>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </div>
              <Button onClick={handleSave}>Salvar Configurações</Button>
            </div>
          </Card>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Backup e Restauração
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-slate-900">Último Backup</p>
                <p className="text-sm text-slate-600 mt-1">01/02/2026 às 00:00 UTC</p>
              </div>
              <div className="flex gap-2">
                <Button>Fazer Backup Agora</Button>
                <Button variant="outline">Restaurar Backup</Button>
              </div>
              <div className="mt-6">
                <label className="text-sm font-medium text-slate-700">Agendar Backup Automático</label>
                <div className="mt-2 flex gap-2">
                  <select className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Diariamente</option>
                    <option>Semanalmente</option>
                    <option>Mensalmente</option>
                  </select>
                  <Button>Configurar</Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
