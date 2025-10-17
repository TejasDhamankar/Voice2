// In app/api/contacts/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Contact from "@/models/contactModel";
import { getUserFromRequest } from "@/lib/jwt";

/**
 * GET all contacts for the logged-in user
 */
export async function GET(request: NextRequest) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData || !userData.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        await connectDB();
        const contacts = await Contact.find({ userId: userData.userId }).sort({ updatedAt: -1 });
        return NextResponse.json({ contacts });
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST a new contact (or update an existing one)
 * This uses "upsert" logic: it updates the contact if one with the same phone number exists,
 * otherwise, it creates a new one. This prevents duplicate contacts.
 */
export async function POST(request: NextRequest) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData || !userData.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, phoneNumber, email, company } = body;

        if (!name || !phoneNumber) {
            return NextResponse.json({ message: "Name and phone number are required" }, { status: 400 });
        }

        await connectDB();

        const contactData = {
            userId: userData.userId,
            name,
            phoneNumber,
            email,
            company,
            lastContacted: new Date(), // Set last contacted time on creation/update
        };

        // Find a contact by phone number for this user and update it, or create a new one if it doesn't exist.
        const contact = await Contact.findOneAndUpdate(
            { userId: userData.userId, phoneNumber: phoneNumber },
            { $set: contactData },
            { new: true, upsert: true, runValidators: true }
        );

        return NextResponse.json({ message: "Contact saved successfully", contact }, { status: 201 });

    } catch (error) {
        console.error("Error saving contact:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}