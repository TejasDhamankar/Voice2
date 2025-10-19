"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import { DashboardHeader } from "@/components/dashboard/header"; // Assuming you have a DashboardHeader
import { Loader2 } from "lucide-react"; // For loading states

// --- Base URL for API calls ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// --- SWR Fetcher with Base URL and Error Handling ---
const fetcher = (url: string) => fetch(`${API_BASE_URL}${url}`).then(res => {
    if (!res.ok) {
        throw new Error('Failed to fetch data');
    }
    return res.json();
});

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(8, "Phone number must be valid"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  company: z.string().optional(),
});

// Define a type for Contact for better type safety
type Contact = {
    _id: string;
    name: string;
    phoneNumber: string;
    email?: string;
    company?: string;
    status?: "active" | "inactive";
};

export default function ContactsPage() {
  const { user } = useAuth();
  // Fetch contacts only if the user is authenticated
  const { data, error, isLoading } = useSWR(user ? "/api/contacts" : null, fetcher);
  const contacts: Contact[] = data?.contacts || [];
  
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phoneNumber: "", email: "", company: "" },
  });

  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function onAddContact(formData: z.infer<typeof contactSchema>) {
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add contact");
      }
      form.reset();
      // Re-fetch the contacts list to show the new entry
      mutate(`${API_BASE_URL}/api/contacts`);
    } catch (e: any) {
      console.error("Error creating contact:", e);
      setAddError(e.message);
      // alert("Error creating contact."); // Using a state for error is better than alert
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="min-h-screen text-foreground flex flex-col bg-[#111111]">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto py-8 px-4">
             <div className="w-full max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#F3FFD4]">Contacts</h1>
                    <p className="text-[#A7A7A7] mt-1">Manage your contact list for AI voice calls.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Add Contact Form */}
                    <div className="lg:col-span-1">
                        <Card className="bg-[#1a1a1a] border border-[#333333] shadow-lg">
                          <CardHeader>
                            <CardTitle>Add New Contact</CardTitle>
                            <CardDescription className="text-[#A7A7A7]">Fill out the details to add a contact.</CardDescription>
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
                                      <Input {...field} placeholder="+91 12345 67890" className="bg-[#222222] border-[#333333] text-[#F3FFD4]" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name="email" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email (Optional)</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="email@example.com" className="bg-[#222222] border-[#333333] text-[#F3FFD4]" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                <FormField control={form.control} name="company" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Company (Optional)</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Company Name" className="bg-[#222222] border-[#333333] text-[#F3FFD4]" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}/>
                                {addError && <p className="text-sm text-red-500">{addError}</p>}
                                <Button type="submit" className="w-full bg-[#A7B3AC] text-[#111] hover:bg-[#A7B3AC]/90 disabled:opacity-70" disabled={adding}>
                                  {adding ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/> Adding...</> : "Add Contact"}
                                </Button>
                              </form>
                            </Form>
                          </CardContent>
                        </Card>
                    </div>

                    {/* Contacts List */}
                    <div className="lg:col-span-2">
                        <Card className="bg-[#1a1a1a] border border-[#333333] shadow-lg h-full flex flex-col">
                          <CardHeader>
                            <CardTitle>Your Contacts</CardTitle>
                            <CardDescription className="text-[#A7A7A7]">All saved contacts are listed here.</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 overflow-hidden">
                            {isLoading && (
                                <div className="text-center py-12 text-[#A7A7A7] flex items-center justify-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Loading contacts...</span>
                                </div>
                            )}
                            {error && <p className="text-red-500 text-center py-12">Failed to load contacts. Please refresh.</p>}
                            {!isLoading && !error && (
                                <ScrollArea className="h-[500px] pr-4">
                                  {contacts.length === 0 ? (
                                    <div className="text-center py-12 text-[#A7A7A7]">No contacts found. Add one using the form.</div>
                                  ) : (
                                    <ul className="space-y-3">
                                      {contacts.map((contact) => (
                                        <li key={contact._id} className="p-3 flex items-center gap-4 bg-[#1f1f1f] rounded-lg border border-[#333333] hover:border-[#A7B3AC] transition-colors duration-200">
                                          <Avatar className="h-12 w-12 bg-[#A7B3AC]/10">
                                            <AvatarFallback className="text-[#A7B3AC] font-bold text-lg">{contact.name?.charAt(0).toUpperCase() || "C"}</AvatarFallback>
                                          </Avatar>
                                          <div className="flex flex-col flex-1 min-w-0">
                                            <span className="font-semibold text-lg truncate">{contact.name}</span>
                                            <span className="text-sm text-[#A7A7A7] truncate">{contact.phoneNumber}</span>
                                            {contact.email && <span className="text-xs text-muted-foreground truncate">{contact.email}</span>}
                                            {contact.company && <span className="text-xs text-muted-foreground truncate">{contact.company}</span>}
                                          </div>
                                          {/* You can add action buttons here (e.g., Edit, Delete) */}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </ScrollArea>
                            )}
                          </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    </div>
  );
}
