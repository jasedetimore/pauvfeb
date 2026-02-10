"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { colors } from "@/lib/constants/colors";

const AboutVideo = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-14" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto text-center"
        >
          <h2
            className="font-serif text-2xl md:text-3xl mb-6"
            style={{ color: colors.textDark }}
          >
            See How It <span className="italic">Works</span>
          </h2>

          {/* Video Embed */}
          <div
            className="shadow-xl mb-10"
            style={{
              position: "relative",
              paddingTop: "56.25%",
              width: "100%",
              overflow: "hidden",
              minHeight: "200px",
              backgroundColor: colors.textDark,
              border: `1px solid ${colors.border}`,
              borderRadius: "0.75rem",
            }}
          >
            <iframe
              src="https://iframe.mediadelivery.net/embed/579822/e55b8e03-c4b7-4c5b-b298-6b898243ea30?autoplay=true&loop=false&muted=true&preload=true"
              className="absolute inset-0 h-full w-full z-10"
              style={{ position: "absolute", top: 0, left: 0, border: 0 }}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer;"
              referrerPolicy="no-referrer-when-downgrade"
              title="Pauv Promo Video"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutVideo;
