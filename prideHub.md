

# SYSTEM ROLE

Think as you are a Senior Full-Stack Software Architect and Principal Engineer.

Your goal is to build a **production-ready**, **enterprise-grade**, **scalable**, **responsive**, and **secure** Event Management Platform called **PrideHub**.

The application must follow modern best practices and produce clean, maintainable, well-documented code.

Never generate placeholder code unless explicitly requested.

Every feature must be fully functional.

---

# Project Name

**PrideHub**

Tagline:

> Where Every Celebration Comes to Life

---

# Tech Stack

## Frontend

* Angular 20
* Standalone Components
* Angular Signals
* RxJS
* Angular Material
* Tailwind CSS
* SCSS
* Angular Router
* Lazy Loading
* OnPush Change Detection
* Angular CDK
* ngx-translate (multi-language ready)
* PWA Ready

---

## Backend

* NestJS (latest stable)
* TypeScript
* REST API
* JWT Authentication
* Passport
* Swagger/OpenAPI
* ValidationPipe
* Class Validator
* Prisma ORM
* WebSocket Gateway
* BullMQ
* Redis
* File Upload
* Rate Limiting
* Helmet
* Compression
* Logging
* Global Exception Filter

---

## Database

**PostgreSQL 18**

Requirements:

* UUID Primary Keys
* Foreign Keys
* Cascading Deletes
* Transactions
* Indexes
* Full-text Search
* Generated Columns where appropriate
* JSONB support
* Views
* Materialized Views
* Triggers where appropriate
* Optimized indexes
* Database migrations
* Seed data

---

## Storage

Support configurable providers:

* Local Storage
* AWS S3
* Cloudinary

Storage provider should be configurable via environment variables.

---

## Authentication

Implement

* JWT Access Token
* Refresh Token
* Email Verification
* Password Reset
* OTP Verification
* Google Login
* Facebook Login
* Optional Microsoft Login

Roles

* Super Admin
* Admin
* Event Planner
* Vendor
* Client

Permission-based authorization.

---

# Application Modules

---

## Landing Website

Pages

Home

About

Services

Packages

Portfolio

Gallery

Testimonials

Venues

Blog

FAQs

Contact

Privacy Policy

Terms

Cookie Policy

---

## Home Page

Must contain

Hero Section

Video Background

Animated Statistics

Featured Services

Featured Packages

Featured Venues

Latest Events

Gallery Preview

Testimonials Slider

Blog Preview

Partners

CTA

Newsletter

Footer

---

## About Page

Company Story

Vision

Mission

Core Values

Our Team

Awards

Timeline

---

## Services

Dynamic CRUD

Examples

Wedding Planning

Birthday Parties

Corporate Events

Graduations

Engagement

Baby Shower

Traditional Wedding

Decoration

Photography

Videography

Music

MC Services

Transportation

Catering

Florists

Venue Booking

Live Streaming

---

Each service includes

* Images
* Videos
* Description
* Price
* Duration
* Category
* SEO

---

## Packages

Silver

Gold

Platinum

Diamond

Each package includes

* Features
* Images
* Pricing
* Optional add-ons
* Discounts
* Availability

---

## Venues

CRUD

Each venue

* Images
* Videos
* Capacity
* Amenities
* Pricing
* Calendar
* GPS Location
* Google Maps
* Reviews

---

## Vendors

Categories

Photographer

Videographer

DJ

Band

Decorator

Florist

Caterer

Transport

Cake Designer

Makeup Artist

Security

Cleaning

Equipment Rental

Vendor Profile

Portfolio

Ratings

Availability

Pricing

Reviews

---

## Gallery

Albums

Categories

Images

Videos

Filtering

Infinite Scroll

Lightbox

---

## Portfolio

Past Events

Filter

Category

Venue

Year

Client

---

## Testimonials

Rating

Review

Images

Approval Workflow

---

## Blog

Categories

Tags

SEO

Rich Text

Draft

Published

Scheduled Publishing

Comments

---

## Booking System

Users can

Select Service

Choose Package

Choose Venue

Select Vendors

Choose Event Date

Guest Count

Budget

Special Requests

Upload Inspiration Images

Receive Quotation

Accept Quote

Pay Deposit

Track Progress

Download Invoice

---

Booking Status

Pending

Consultation

Quotation

Confirmed

Planning

In Progress

Completed

Cancelled

Refunded

---

## Event Management

Timeline

Tasks

Checklist

Assigned Planner

Assigned Vendors

Budget Tracking

Documents

Contracts

Invoices

Timeline Updates

Progress Bar

---

## Payments

Support

Chapa

Telebirr

Stripe

Manual Bank Transfer

Generate

Invoice

Receipt

Refund

Payment History

Partial Payments

Installments

---

## Notifications

Email

SMS

Push Notifications

In-App Notifications

WhatsApp Ready

---

## Messaging

Real-time Chat

Client ↔ Planner

Planner ↔ Vendor

Attachments

Images

Files

Typing Indicator

Read Receipts

---

## Dashboard

Statistics

Revenue

Bookings

Users

Events

Pending Payments

Upcoming Events

Calendar

Charts

KPIs

---

## Reports

Revenue

Bookings

Customers

Popular Packages

Popular Venues

Vendor Performance

Exports

PDF

Excel

CSV

---

## CRM

Customers

Lead Tracking

Follow-ups

Email Templates

Customer Notes

---

## Calendar

Month

Week

Day

Drag & Drop

Conflict Detection

Availability

---

## File Management

Images

Videos

Contracts

Invoices

Documents

Folders

Permissions

---

## Search

Global Search

Using PostgreSQL Full Text Search

Search

Events

Bookings

Clients

Venues

Vendors

Blogs

Services

---

## Admin Panel

Manage Everything

Users

Roles

Permissions

Bookings

Events

Payments

Vendors

Services

Packages

Gallery

Testimonials

Blogs

Reports

Settings

---

# Database Design

Create normalized PostgreSQL 18 schema.

Include

Users

Roles

Permissions

RolePermission

UserRole

Clients

Events

Bookings

BookingItems

Venues

VenueAvailability

Services

Packages

PackageItems

Vendors

VendorCategories

VendorAvailability

Invoices

Payments

Refunds

Reviews

Gallery

Media

Testimonials

Blogs

Categories

Tags

Notifications

Messages

Files

Tasks

Contracts

ActivityLogs

AuditLogs

SystemSettings

Newsletter

FAQ

Contacts

SupportTickets

OTP

RefreshTokens

Sessions

---

# API Standards

RESTful

/api/v1/

Response

```json
{
  "success": true,
  "message": "",
  "data": {},
  "errors": []
}
```

Validation

Swagger

Pagination

Sorting

Filtering

Search

Soft Delete

Audit Trail

---

# Angular Requirements

Use

Signals

Computed Signals

Effects

Standalone Components

Lazy Loading

OnPush

TrackBy

Route Guards

Resolvers

Interceptors

Error Handling

Loading States

Skeleton Loaders

Infinite Scroll

Virtual Scroll

Reactive Forms

Typed Forms

Dynamic Forms

Dark Mode

Responsive Design

Accessibility (WCAG AA)

---

# UI Design

Modern Luxury Theme

Colors

Primary

#8B1538

Secondary

#D4AF37

Accent

#F8F5F2

Text

#2B2B2B

Background

#FFFFFF

Rounded Cards

Glassmorphism

Elegant Animations

Responsive

Mobile First

---

# Security

Helmet

CORS

Rate Limiting

CSRF Protection where applicable

Secure Cookies

Password Hashing

Input Validation

Sanitization

XSS Protection

SQL Injection Protection

JWT Rotation

Refresh Tokens

RBAC

Audit Logging

Encryption for sensitive data

---

# Performance

SSR-ready architecture

Lazy Loading

Image Optimization

Caching

Redis

Pagination

Virtual Scroll

Database Indexing

Connection Pooling

Compression

ETags

HTTP Cache Headers

CDN-ready assets

---

# DevOps

Docker

Docker Compose

Environment Variables

GitHub Actions

CI/CD

Nginx

Health Checks

Logging

Monitoring

---

# Testing

Frontend

Unit Tests

Component Tests

E2E

Backend

Unit Tests

Integration Tests

E2E

Coverage > 90%

---

# Documentation

Generate

README

API Documentation

Database ERD

Architecture Diagram

Deployment Guide

Environment Setup

Developer Guide

---

# Seed Data

Generate realistic seed data for

* 200 Users
* 100 Vendors
* 50 Venues
* 500 Bookings
* 200 Gallery Items
* 100 Testimonials
* 100 Blog Posts
* 50 Packages
* 100 Services

---

# Deliverables

you should generate:

1. Complete Angular 20 application.
2. Complete NestJS backend.
3. PostgreSQL 18 schema and Prisma migrations.
4. Seed scripts.
5. Docker and Docker Compose configuration.
6. Swagger documentation.
7. Comprehensive tests.
8. CI/CD workflow.
9. Production-ready deployment configuration.
10. Well-structured, documented, maintainable code following SOLID principles, Clean Architecture, and modular design.


