import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const Problem = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const creators = [
    "Singers",
    "Influencers", 
    "Athletes",
    "Actors",
    "Authors",
    "Streamers",
    "Podcasters",
  ];

  return (
    <section ref={ref} className="py-14 bg-light">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="font-serif text-2xl md:text-3xl text-dark mb-4">
            The Creator <span className="text-gold italic">Treadmill</span>
          </h2>
          
          <p className="text-dark/70 text-sm leading-relaxed mb-6">
            If you're a creator, you know the grind. Stop posting? Rewards stop. 
            No new book? No royalties. Miss a season? No paycheck. 
            You're always one step away from zero.
          </p>

          {/* Creator types */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {creators.map((creator, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                className="px-3 py-1 bg-light-soft border border-gold/30 rounded-full text-dark/60 text-xs"
              >
                {creator}
              </motion.span>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-dark rounded-lg p-5"
          >
            <p className="text-gold font-medium text-sm mb-1">
              Pauv changes this.
            </p>
            <p className="text-light/70 text-xs">
              List yourself once, receive rewards forever—whether you're creating content or not. 
              Your reputation works for you, even while you sleep.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Problem;