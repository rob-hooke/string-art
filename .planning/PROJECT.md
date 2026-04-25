# Project: String Art Generator

## Overview
A web-based tool that transforms any image into physical string art instructions. It calculates nail positions and a routing path to recreate the image using a single continuous string.

## Vision
To provide a reliable, minimalist, and easy-to-use tool for craft enthusiasts to create complex string art with precise, printable instructions.

## Core Values
- **Precision:** Accurate nail placement and routing.
- **Reliability:** Stable performance across all canvas sizes and image types.
- **Simplicity:** A minimalist UI that focuses on the core task.

## Key Features
- **Customizable Canvas:** Support for various physical dimensions (cm/inches).
- **Smart Nail Placement:** Automatic calculation of nail count based on spacing.
- **Image Processing:** Grayscale conversion and string path optimization.
- **Exportable Instructions:** PDF and TXT routing guides, plus PNG nail overlays.
- **Real-time Preview:** Interactive visualization of the string routing process.

## Tech Stack
- **Frontend:** React 18, Vite.
- **Logic:** Custom greedy algorithm for string routing.
- **PDF Generation:** jsPDF.
- **Testing:** Vitest, React Testing Library.

## Target Audience
- DIY hobbyists and craft artists.
- Makers looking for algorithmic art tools.
- Educators demonstrating geometry or algorithmic concepts.
