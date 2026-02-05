import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const Benefits = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const otherBenefits = [
    {
      icon: "📈",
      title: "Fan Engagement Insights",
      description: "Live, quantifiable public sentiment data.",
    },
    {
      icon: "🤝",
      title: "Deeper Engagement",
      description: "Deeply committed supporters show up more.",
    },
    {
      icon: "🎯",
      title: "Brand Leverage",
      description: "Your Social Engagement Score becomes proof for deals.",
    },
  ];

  return (
    <section ref={ref} className="py-16 bg-dark">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-serif text-2xl md:text-3xl text-light mb-3">
            Why <span className="italic">List Yourself</span>?
          </h2>
        </motion.div>

        {/* Other Benefits - Secondary */}
        <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {otherBenefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="group bg-dark-soft border border-border rounded-lg p-4 hover:border-gold/50 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{benefit.icon}</span>
                <h3 className="font-medium text-light text-sm">{benefit.title}</h3>
              </div>
              <p className="text-light/60 text-xs leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
