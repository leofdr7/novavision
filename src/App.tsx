import { useLayoutEffect } from "react";
import { About } from "./components/About";
import { Contact } from "./components/Contact";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { ScrollProgress } from "./components/ScrollProgress";
import { Services } from "./components/Services";
import { TrustBar } from "./components/TrustBar";
import { ContactWidgets } from "./components/ContactWidgets";

export default function App() {
  useLayoutEffect(() => {
    // The browser can resolve a URL fragment before React has mounted its target.
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView({ behavior: "instant", block: "start" });
  }, []);

  return (
    <>
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <About />
        <Services />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <ContactWidgets />
    </>
  );
}
