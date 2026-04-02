import { motion } from "framer-motion";
import { DashboardPreview } from "./dashboard/DashboardPreview";

export function SolutionSection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-3xl font-bold md:text-4xl lg:text-5xl">
              Uma plataforma. <span className="text-gradient">Controle total.</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Hospede o NexusZAP no seu próprio servidor. Conecte seu WhatsApp via QR Code, configure o robô do Telegram e escolha o seu provedor de IA preferido.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mx-auto"
        >
          <DashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}
