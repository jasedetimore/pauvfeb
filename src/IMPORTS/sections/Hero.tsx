import { motion } from "framer-motion";
import { Button } from "../ui/button";
import appMockup from "@/assets/app-mockup.png";

const Hero = () => {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] bg-dark overflow-hidden flex items-center py-12 lg:py-0">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-soft to-dark" />
      
      {/* Gold accent glow */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gold/5 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center justify-items-center">
          {/* Left content */}
          <div className="text-center lg:text-left lg:pl-8 xl:pl-16 w-full">
            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-5xl md:text-5xl lg:text-6xl text-light leading-tight mb-4"
            >
              Unlock the Value of
              <span className="block text-gold italic">Your Brand</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg text-light/70 font-sans max-w-md mx-auto lg:mx-0 mb-6 leading-relaxed"
            >
              List yourself for free in 10 minutes. Long term fan loyalty.
              Let Fans Support Your Journey.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center"
            >
              <a href="#waitlist">
                <Button size="sm" className="!bg-light !text-dark hover:!bg-light/90 rounded-full px-5 py-2">
                  Get in Contact
                </Button>
              </a>
              <a href="#benefits">
                <Button variant="outline" size="sm" className="!bg-transparent !border-2 !border-light !text-light hover:!bg-light hover:!text-dark rounded-full px-5 py-2">
                  Learn More
                </Button>
              </a>
            </motion.div>

            {/* Mobile App Mockup - Show on mobile only */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-8 lg:hidden flex justify-center"
            >
              <div className="relative flex items-center justify-center">
                {/* Glow behind mockup */}
                <div className="absolute inset-0 bg-gold/20 rounded-full blur-3xl scale-75" />
                <img 
                  src={appMockup} 
                  alt="Pauv App" 
                  className="relative z-10 h-[580px] object-contain drop-shadow-2xl"
                />
              </div>
            </motion.div>

            {/* Download MVP */}
          </div>

          {/* Right - App Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex justify-center items-center"
          >
            <div className="relative flex items-center justify-center">
              {/* Glow behind mockup */}
              <div className="absolute inset-0 bg-gold/20 rounded-full blur-3xl scale-75" />
              <img 
                src={appMockup} 
                alt="Pauv App" 
                className="relative z-10 h-[510px] object-contain drop-shadow-2xl"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
