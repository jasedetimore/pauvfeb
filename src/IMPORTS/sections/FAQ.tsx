import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";

const FAQ = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Is this ownership of a person?",
      answer: "No. PV ownership grants no claim on your life, income, or contracts. It's purely a digital collectible—like a virtual trading card.",
    },
    {
      question: "Is this crypto?",
      answer: "No. There's no mining, no external wallets, no rug pulls. PVs are for use exclusively within the Pauv community ecosystem.",
    },
    {
      question: "How much does it cost?",
      answer: "Zero dollars. Listing yourself is completely free. We make money from transaction fees.",
    },
    {
      question: "How do I receive rewards?",
      answer: "Automatically. Every exchange gives you 0.35% deposited to your account. Continuous creator royalties.",
    },
  ];

  return (
    <section ref={ref} className="py-14 bg-dark">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="font-serif text-2xl md:text-3xl text-light">
            Let's Be <span className="text-gold italic">Clear</span>
          </h2>
        </motion.div>

        <div className="max-w-xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="mb-2"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-4 bg-dark-soft rounded-lg border border-gold/10 hover:border-gold/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-light text-sm pr-4">{faq.question}</h3>
                  <motion.span
                    animate={{ rotate: openIndex === index ? 45 : 0 }}
                    className="text-gold text-lg flex-shrink-0"
                  >
                    +
                  </motion.span>
                </div>
                <motion.div
                  initial={false}
                  animate={{
                    height: openIndex === index ? "auto" : 0,
                    opacity: openIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="text-light/60 mt-2 text-xs leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
