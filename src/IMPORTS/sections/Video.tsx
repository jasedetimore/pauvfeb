import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const Video = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-14 bg-light">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto text-center"
        >
          <h2 className="font-serif text-2xl md:text-3xl text-dark mb-6">
            See How It <span className="italic">Works</span>
          </h2>
          
          {/* Video Embed (Cloudflare Stream iframe) */}
          <div
            style={{ position: "relative", paddingTop: "56.25%", width: "100%", overflow: "hidden", minHeight: "200px" }}
            className="rounded-xl border border-border shadow-xl mb-10 bg-black"
          >
            <iframe
              src="https://iframe.mediadelivery.net/embed/579822/e55b8e03-c4b7-4c5b-b298-6b898243ea30?autoplay=true&loop=false&muted=true&preload=true"
              className="absolute inset-0 h-full w-full z-10"
              style={{ position: "absolute", top: 0, left: 0, border: 0 }}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer;"
              referrerPolicy="no-referrer-when-downgrade"
              title="Pauv Promo Video"
              playsInline={true}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Video;