import { useState } from "react";
import { EmailCampaigns } from "./EmailCampaigns";
import { SmsCampaigns } from "./SmsCampaigns";
import { Mail, MessageSquare, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function CampaignsPage() {
    const [view, setView] = useState<"landing" | "email" | "sms">("landing");

    if (view === "email") {
        return <EmailCampaigns onBack={() => setView("landing")} />;
    }

    if (view === "sms") {
        return <SmsCampaigns onBack={() => setView("landing")} />;
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Campanhas de Marketing</h1>
                <p className="text-slate-600">Escolha o canal para se comunicar com seus alunos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Email Card */}
                <div
                    onClick={() => setView("email")}
                    className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-sky-300 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Mail className="w-32 h-32 text-sky-500" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Mail className="w-7 h-7 text-sky-600" />
                        </div>

                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Campanhas por Email</h3>
                        <p className="text-slate-600 mb-8 flex-grow">
                            Envie newsletters, avisos e campanhas de marketing via email. Suporte a envio único e em massa com templates HTML.
                        </p>

                        <div className="flex items-center text-sky-600 font-semibold group-hover:translate-x-2 transition-transform">
                            Gerenciar Emails <ArrowRight className="w-5 h-5 ml-2" />
                        </div>
                    </div>
                </div>

                {/* SMS Card */}
                <div
                    onClick={() => setView("sms")}
                    className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <MessageSquare className="w-32 h-32 text-emerald-500" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <MessageSquare className="w-7 h-7 text-emerald-600" />
                        </div>

                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Campanhas por SMS</h3>
                        <p className="text-slate-600 mb-8 flex-grow">
                            Envie notificações urgentes e transacionais diretamente para o celular dos alunos. Alta taxa de abertura e entrega rápida.
                        </p>

                        <div className="flex items-center text-emerald-600 font-semibold group-hover:translate-x-2 transition-transform">
                            Gerenciar SMS <ArrowRight className="w-5 h-5 ml-2" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-semibold text-slate-700 mb-2">Sobre as integrações</h4>
                <p className="text-sm text-slate-500">
                    O sistema utiliza a API da <strong>Brevo (antiga Sendinblue)</strong> para realizar os disparos.
                    Certifique-se de que sua chave de API esteja configurada corretamente no backend e que você possua créditos suficientes na plataforma.
                </p>
            </div>
        </div>
    );
}
