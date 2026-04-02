import { motion } from "framer-motion";
import { Smartphone, Brain, BookOpen, Cpu, LayoutDashboard, Shield } from "lucide-react";

const features = [
  {
    title: "Múltiplos Canais",
    desc: "Leia e envie mensagens do WhatsApp (via pareamento QR) e Telegram Bot na mesma plataforma.",
    icon: <Smartphone className="w-6 h-6" />
  },
  {
    title: "IA Configurável",
    desc: "Crie personas, instruções de sistema e limite de temperatura da IA para cada canal separadamente.",
    icon: <Brain className="w-6 h-6" />
  },
  {
    title: "Base de Conhecimento",
    desc: "Faça upload de arquivos (TXT, PDF, DOCX até 5MB) para a IA ler e responder baseada apenas nos seus dados.",
    icon: <BookOpen className="w-6 h-6" />
  },
  {
    title: "Vários Provedores",
    desc: "Integração oficial com Groq (ultra rápido), Google Gemini e OpenRouter (centenas de modelos).",
    icon: <Cpu className="w-6 h-6" />
  },
  {
    title: "Painel de Controle",
    desc: "Interface web clean para criar instâncias, verificar status, testar promts e atualizar dados da IA.",
    icon: <LayoutDashboard className="w-6 h-6" />
  },
  {
    title: "100% Seguro",
    desc: "JWT, Helmet e CORS configurados. Seus dados de chat não saem do seu servidor (SQLite local).",
    icon: <Shield className="w-6 h-6" />
  }
];

export function FeaturesGrid() {
  return (
    <section id="funcionalidades" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            O que você tem no painel
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Todas as ferramentas para orquestrar sua frota de agentes autônomos sem complicação.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              className="glass-card rounded-2xl p-6 hover:bg-secondary/50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
