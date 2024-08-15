/** @type {import('next').NextConfig} */
import { withPlausibleProxy } from "next-plausible";
const nextConfig = withPlausibleProxy()({});

export default nextConfig;
