// public/auth.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://kesmvuagqejhjapbtyxa.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlc212dWFncWVqaGphcGJ0eXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Njk5NzgsImV4cCI6MjA2OTQ0NTk3OH0.QQCuyekoXlzlG3H6JBj1YxS_LE0RZV1QIdhJDl1Kats";

export const supabase = createClient(supabaseUrl, supabaseKey);
