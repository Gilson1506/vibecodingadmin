import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, Users, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { API_URL } from "@/lib/supabase";
import axios from "axios";

export function EmailCampaigns({ onBack }: { onBack: () => void }) {
    const [emailType, setEmailType] = useState<"single" | "bulk">("single");
    const [to, setTo] = useState("");
    const [recipients, setRecipients] = useState("");
    const [subject, setSubject] = useState("");
    const [htmlContent, setHtmlContent] = useState("");
    const [senderName, setSenderName] = useState("Vibe Coding");
    const [senderEmail, setSenderEmail] = useState("noreply@vibecoding.com");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setResult(null);
        setIsLoading(true);

        try {
            if (emailType === "single") {
                const response = await axios.post(`${API_URL}/api/email/send`, {
                    to,
                    subject,
                    htmlContent,
                    senderName,
                    senderEmail
                });
                setResult(response.data);
                setSuccess(true);
            } else {
                const recipientList = recipients.split("\n").map(r => r.trim()).filter(r => r);
                const response = await axios.post(`${API_URL}/api/email/send-bulk`, {
                    recipients: recipientList,
                    subject,
                    htmlContent,
                    senderName,
                    senderEmail
                });
                setResult(response.data);
                setSuccess(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Erro ao enviar email");
        } finally {
            setIsLoading(false);
        }
    };

    const fillTemplate = () => {
        setSubject("Bem-vindo à Vibe Coding!");
        setHtmlContent(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 20px; }
    .card { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0ea5e9, #0369a1); padding: 32px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 32px; }
    .content p { color: #64748b; line-height: 1.6; }
    .btn { display: inline-block; background: #0ea5e9; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; color: #94a3b8; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🎉 Bem-vindo!</h1>
    </div>
    <div class="content">
      <p>Olá,</p>
      <p>Seja bem-vindo à <strong>Vibe Coding</strong>!</p>
      <p style="text-align: center;">
        <a href="http://localhost:5174" class="btn">Acessar Plataforma</a>
      </p>
    </div>
    <div class="footer">
      <p>© 2026 Vibe Coding • Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>
    `.trim());
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Email Marketing</h2>
                    <p className="text-slate-600">Gerencie e envie campanhas de email</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <Card className="lg:col-span-2 p-6 bg-white border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Type */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => setEmailType("single")}
                                className={`flex-1 p-4 rounded-xl border-2 transition-all ${emailType === "single"
                                    ? "border-sky-500 bg-sky-50"
                                    : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <Mail className={`w-6 h-6 mx-auto mb-2 ${emailType === "single" ? "text-sky-500" : "text-gray-400"}`} />
                                <p className={`font-medium ${emailType === "single" ? "text-sky-700" : "text-gray-600"}`}>
                                    Email Único
                                </p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setEmailType("bulk")}
                                className={`flex-1 p-4 rounded-xl border-2 transition-all ${emailType === "bulk"
                                    ? "border-sky-500 bg-sky-50"
                                    : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <Users className={`w-6 h-6 mx-auto mb-2 ${emailType === "bulk" ? "text-sky-500" : "text-gray-400"}`} />
                                <p className={`font-medium ${emailType === "bulk" ? "text-sky-700" : "text-gray-600"}`}>
                                    Email em Massa
                                </p>
                            </button>
                        </div>

                        {/* Recipient(s) */}
                        {emailType === "single" ? (
                            <div className="space-y-2">
                                <Label htmlFor="to" className="text-slate-700 font-medium">Destinatário</Label>
                                <Input
                                    id="to"
                                    type="email"
                                    placeholder="usuario@email.com"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                    className="h-12 bg-gray-50 border-gray-300"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="recipients" className="text-slate-700 font-medium">
                                    Destinatários (um por linha)
                                </Label>
                                <Textarea
                                    id="recipients"
                                    placeholder="usuario1@email.com&#10;usuario2@email.com&#10;usuario3@email.com"
                                    value={recipients}
                                    onChange={(e) => setRecipients(e.target.value)}
                                    className="min-h-[120px] bg-gray-50 border-gray-300"
                                    required
                                />
                            </div>
                        )}

                        {/* Sender Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="senderName" className="text-slate-700 font-medium">Nome do Remetente</Label>
                                <Input
                                    id="senderName"
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                    className="h-12 bg-gray-50 border-gray-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="senderEmail" className="text-slate-700 font-medium">Email do Remetente</Label>
                                <Input
                                    id="senderEmail"
                                    type="email"
                                    value={senderEmail}
                                    onChange={(e) => setSenderEmail(e.target.value)}
                                    className="h-12 bg-gray-50 border-gray-300"
                                />
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-slate-700 font-medium">Assunto</Label>
                            <Input
                                id="subject"
                                placeholder="Assunto do email"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="h-12 bg-gray-50 border-gray-300"
                                required
                            />
                        </div>

                        {/* HTML Content */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="htmlContent" className="text-slate-700 font-medium">Conteúdo HTML</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={fillTemplate}
                                    className="text-sky-600 border-sky-300 hover:bg-sky-50"
                                >
                                    Usar Template
                                </Button>
                            </div>
                            <Textarea
                                id="htmlContent"
                                placeholder="<h1>Olá!</h1><p>Seu conteúdo HTML aqui...</p>"
                                value={htmlContent}
                                onChange={(e) => setHtmlContent(e.target.value)}
                                className="min-h-[300px] font-mono text-sm bg-gray-50 border-gray-300"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-semibold shadow-lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5 mr-2" />
                                    Enviar Email{emailType === "bulk" ? "s" : ""}
                                </>
                            )}
                        </Button>
                    </form>
                </Card>

                {/* Status */}
                <div className="space-y-4">
                    {success && (
                        <Card className="p-6 bg-green-50 border border-green-200">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-green-800 mb-1">Email enviado!</h3>
                                    {result && (
                                        <div className="text-sm text-green-700 space-y-1">
                                            {result.sent && <p>Enviados: {result.sent}</p>}
                                            {result.failed !== undefined && <p>Falhas: {result.failed}</p>}
                                            {result.messageId && <p className="text-xs opacity-70">ID: {result.messageId}</p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {error && (
                        <Card className="p-6 bg-red-50 border border-red-200">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-red-800 mb-1">Erro ao enviar</h3>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card className="p-6 bg-sky-50 border border-sky-200">
                        <h3 className="font-semibold text-sky-800 mb-3">💡 Dicas</h3>
                        <ul className="text-sm text-sky-700 space-y-2">
                            <li>• Use HTML válido no conteúdo</li>
                            <li>• Teste com um email único primeiro</li>
                            <li>• Emails em massa podem demorar</li>
                            <li>• Verifique o spam após envio</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default EmailCampaigns;
