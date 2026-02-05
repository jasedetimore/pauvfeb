import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const Story = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-14 bg-dark">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center"
        >
          <span className="text-gold font-medium tracking-wide text-xs uppercase mb-3 block">
            The Pauv Story
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-light mb-6">
            From Garage to <span className="italic">Platinum</span>
          </h2>
          
          <div className="bg-dark-soft rounded-xl p-6 text-left">
            <p className="text-light/80 text-sm leading-relaxed mb-4">
              <span className="text-gold font-medium">Little Timmy</span> just graduated high school. 
              He doesn't want college—he wants to be a singer. He takes 10 minutes to list himself on Pauv. 
              Cost: <span className="text-gold">$0</span>.
            </p>
            <p className="text-light/80 text-sm leading-relaxed mb-4">
              His grandma, teachers, and early supporters buy his PVs. A decade later, 
              Little Timmy is a star.
            </p>
            <p className="text-light/80 text-sm leading-relaxed">
              Those early supporters? They celebrate his success with unique digital rewards. Timmy was able to afford a new mic 
              when he was still in his garage, and his grandma was rewarded for her early support.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Story;
