"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(8, "Phone number must be valid"),
  email: z.string().optional(),
  company: z.string().optional(),
});

export default function ContactsPage() {
  const { data, error } = useSWR("/api/contacts", fetcher);
  const contacts = Array.isArray(data?.contacts) ? data.contacts : [];
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phoneNumber: "", email: "", company: "" },
  });

  const [adding, setAdding] = useState(false);

  async function onAddContact(formData: z.infer<typeof contactSchema>) {
    setAdding(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to add contact");
      form.reset();
      mutate("/api/contacts");
    } catch (e) {
      alert("Error creating contact.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#111111] py-12 px-4 text-[#F3FFD4] flex justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Add Contact Form */}
        <Card className="bg-[#1a1a1a] border border-[#333333] shadow-lg">
          <CardHeader>
            <CardTitle>Add New Contact</CardTitle>
            <CardDescription>Fill out the details below to add a contact.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onAddContact)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" className="bg-[#222222] border-[#333333] text-[#F3FFD4]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1234567890" className="bg-[#222222] border-[#333333] text-[#F3FFD4]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="email@example.com" className="bg-[#222222] border-[#333333] text-[#F3FFD4]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Company Name" className="bg-[#222222] border-[#333333] text-[#F3FFD4]" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <Button type="submit" className="w-full bg-[#FEB300] text-[#111]" disabled={adding}>
                  {adding ? "Adding..." : "Add Contact"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Contacts List */}
        <Card className="bg-[#1a1a1a] border border-[#333333] shadow-lg">
          <CardHeader>
            <CardTitle>Your Contacts</CardTitle>
            <CardDescription>All your saved contacts are listed here.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500">Failed to load contacts</p>}
            <ScrollArea className="h-[500px]">
              {contacts.length === 0 ? (
                <div className="text-center py-12 text-[#A7A7A7]">No contacts found.</div>
              ) : (
                <ul className="space-y-3">
                  {contacts.map((contact: any) => (
                    <li key={contact._id ?? contact.id} className="p-4 flex items-center gap-4 bg-[#1f1f1f] rounded-lg border border-[#333333] hover:border-[#FEB300] transition-all duration-200 cursor-pointer">
                      <Avatar className="h-12 w-12 bg-gradient-to-br from-[#FEB300] to-[#FF7A00]">
                        <AvatarFallback className="text-[#111] font-bold">{contact.name?.charAt(0).toUpperCase() || "C"}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-lg">{contact.name}</span>
                        <span className="text-sm text-[#A7A7A7]">{contact.phoneNumber}</span>
                        {contact.email && <span className="text-sm text-[#A7A7A7]">{contact.email}</span>}
                        {contact.company && <span className="text-sm text-[#A7A7A7]">{contact.company}</span>}
                        {contact.status && <span className={`mt-1 text-xs font-medium ${contact.status === "active" ? "text-green-400" : "text-red-400"}`}>{contact.status.toUpperCase()}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
