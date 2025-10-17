"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Loader2 } from "lucide-react";

export function ContactForm() {
  // const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    whatsappNumber: "",
    description: "",
    agentType: "support"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, agentType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      const data = await response.json();

      // toast({
      //   title: "Request Submitted",
      //   description: "We'll be calling you shortly on the number you provided.",
      //   variant: "default",
      // });

      setFormData({
        fullName: "",
        email: "",
        whatsappNumber: "",
        description: "",
        agentType: "support"
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      // toast({
      //   title: "Something went wrong",
      //   description: "Please try again later.",
      //   variant: "destructive",
      // });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold mb-4">Experience AI Voice Agents</h2>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Fill out the form below and our AI agent will call you for a demonstration
        </p>
      </div>

      <motion.div
        className="max-w-2xl mx-auto bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-800"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
              className="bg-gray-800 border-gray-700 focus-visible:ring-blue-600"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
              className="bg-gray-800 border-gray-700 focus-visible:ring-blue-600"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="whatsappNumber" className="text-sm font-medium">
              WhatsApp Number
            </label>
            <Input
              id="whatsappNumber"
              name="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={handleChange}
              placeholder="+1234567890"
              required
              className="bg-gray-800 border-gray-700 focus-visible:ring-blue-600"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="agentType" className="text-sm font-medium">
              Agent Type
            </label>
            <Select
              value={formData.agentType}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 focus:ring-blue-600">
                <SelectValue placeholder="Select an agent type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="support">Support Agent</SelectItem>
                <SelectItem value="sales">Sales Agent</SelectItem>
                <SelectItem value="booking">Booking Agent</SelectItem>
                <SelectItem value="qualifier">Lead Qualifier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              What would you like to discuss?
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="I'm interested in learning more about..."
              required
              className="bg-gray-800 border-gray-700 focus-visible:ring-blue-600 min-h-[120px]"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Request AI Call"
            )}
          </Button>
        </form>
      </motion.div>
    </section>
  );
}
