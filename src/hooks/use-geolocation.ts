"use client";
import { useEffect, useState } from "react";
import type { GPSLocation } from "@/types";
export function useGeolocation() { const [location,setLocation]=useState<GPSLocation|null>(null); const [error,setError]=useState<string|null>(null); useEffect(()=>{ if(!navigator.geolocation) {setError("Geolocation unavailable"); return;} navigator.geolocation.getCurrentPosition((position)=>setLocation({latitude:position.coords.latitude,longitude:position.coords.longitude,label:"Current demo location"}),()=>setError("Location permission not granted")); },[]); return {location,error}; }
