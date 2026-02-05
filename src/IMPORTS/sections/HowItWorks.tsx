import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const HowItWorks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const steps = [
    {
      number: "01",
      title: "Create Account",
      description: "10 minutes. No paperwork, no fees.",
    },
    {
      number: "02",
      title: "Get Listed",
      description: "Limited Edition Digital Collectibles",
    },
    {
      number: "03",
      title: "Receive Rewards Forever",
      description: "0.35% of every exchange. Long term fan loyalty.",
    },
  ];

  return (
    <section ref={ref} className="py-14 bg-light">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="font-serif text-2xl md:text-3xl text-dark mb-3">
            Three Steps to <span className="text-gold italic">Freedom</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark mb-3">
                <span className="font-serif text-base text-dark font-medium">
                  {step.number}
                </span>
              </div>
              <h3 className="font-serif text-lg text-dark mb-1">{step.title}</h3>
              <p className="text-dark/60 text-xs">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
