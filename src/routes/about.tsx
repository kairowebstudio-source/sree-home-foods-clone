import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Retro Natural Products" },
      { name: "description", content: "The story behind Retro Natural Products — a family workshop keeping Konaseema's food traditions alive." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="solid" />
      <main className="flex-1">
        <div className="w-full">
          <img
            src="/media/IMG-20260718-WA0003.jpg"
            alt="About Retro Natural Products"
            className="w-full h-auto object-contain"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
