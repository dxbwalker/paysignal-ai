import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { WorkflowProvider } from "@/context/WorkflowContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WorkflowProvider>
      <Component {...pageProps} />
    </WorkflowProvider>
  );
}
