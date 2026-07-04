"use client";

import { motion } from "framer-motion";

export function AboutSection() {
  return (
    <section id="about" className="px-4 md:px-8 py-16 md:py-24 max-w-7xl mx-auto border-t-2 border-lipi-border bg-lipi-cream">
      <div className="text-center mb-10">
        <span className="tag">about</span>
        <h2 className="section-heading mt-3">Why Lipi?</h2>
      </div>

      <div className="max-w-3xl mx-auto space-y-6 font-[family-name:var(--font-space-grotesk)] text-lipi-text/80 text-lg leading-relaxed">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Lipi was born out of a desire to preserve the most personal aspect of our communication: our handwriting. In an increasingly digital world, the warmth and personality of a handwritten note is often lost behind generic typefaces.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          We built this platform to bridge the gap between analog charm and digital convenience. By combining modern web technologies like Next.js and advanced vectorization techniques, Lipi allows anyone to digitize their handwriting effortlessly. 
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Whether you draw directly on our canvas or upload a paper template, every stroke is carefully captured and mapped to a fully functional, downloadable font file (TTF/OTF) that you can use across all your devices and applications.
        </motion.p>
      </div>
    </section>
  );
}
