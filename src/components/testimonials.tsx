import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel";
import Image from "next/image";

const testimonials = [
  {
    quote: "These AI voice agents sound so natural our customers can't tell they're not human. Our support team now focuses on complex issues while the AI handles routine calls.",
    author: "Sarah Johnson",
    title: "Customer Service Director",
    company: "Global Retail Inc.",
    avatar: "/avatars/sarah.jpg"
  },
  {
    quote: "We've increased our lead qualification rate by 70% since implementing the AI voice agents. They pre-screen all calls and only route qualified prospects to our sales team.",
    author: "Michael Rodriguez",
    title: "VP of Sales",
    company: "TechSolutions Ltd",
    avatar: "/avatars/michael.jpg"
  },
  {
    quote: "The booking agent has eliminated scheduling conflicts and reduced no-shows by 45%. Our calendars sync perfectly and the AI handles all the follow-ups.",
    author: "Emily Chen",
    title: "Operations Manager",
    company: "Wellness Clinic",
    avatar: "/avatars/emily.jpg"
  },
];

export function Testimonials() {
  return (
    <section className="py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">What Our Clients Say</h2>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Real results from businesses using our AI voice agents
        </p>
      </div>

      <Carousel className="w-full max-w-5xl mx-auto">
        <CarouselContent>
          {testimonials.map((testimonial, index) => (
            <CarouselItem key={index}>
              <motion.div
                className="bg-gradient-to-br from-gray-900 to-gray-800 p-10 rounded-2xl border border-gray-800"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="relative mb-8">
                  <Image
                    src="/quote.svg"
                    alt="Quote mark"
                    width={48}
                    height={48}
                    className="absolute -top-6 -left-6 text-blue-500 opacity-30"
                  />
                  <p className="text-xl italic text-gray-300">{testimonial.quote}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-bold">{testimonial.author}</p>
                    <p className="text-sm text-gray-400">{testimonial.title}, {testimonial.company}</p>
                  </div>
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="bg-gray-800 border-gray-700 hover:bg-gray-700" />
        <CarouselNext className="bg-gray-800 border-gray-700 hover:bg-gray-700" />
      </Carousel>
    </section>
  );
}
