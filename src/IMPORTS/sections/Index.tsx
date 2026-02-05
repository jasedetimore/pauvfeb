import { Helmet } from "react-helmet-async";
import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import Video from "@/components/sections/Video";
import Benefits from "@/components/sections/Benefits";
import Problem from "@/components/sections/Problem";
import FAQ from "@/components/sections/FAQ";
import HowItWorks from "@/components/sections/HowItWorks";
import Story from "@/components/sections/Story";
import WaitlistForm from "@/components/sections/WaitlistForm";
import Footer from "@/components/sections/Footer";

const Index = () => {
  return (
    <main className="overflow-x-hidden pt-16">
      <Helmet>
        <title>Pauv - Unlock the Value of the Creator Economy</title>
        <meta name="description" content="Pauv is a social engagement platform where you can collect and exchange digital collectibles (PVs) tied to your favorite creators and public figures." />
      </Helmet>
      <Navbar />
      <Hero />
      <Video />
      <section id="benefits" className="scroll-mt-16">
        <Benefits />
      </section>
      <Problem />
      <section id="faq" className="scroll-mt-16">
        <FAQ />
      </section>
      <section id="how-it-works" className="scroll-mt-16">
        <HowItWorks />
      </section>
      <Story />
      <WaitlistForm />
      <Footer />
    </main>
  );
};

export default Index;
