import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Copy, Link as LinkIcon, QrCode, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";

const MONETAG_AD_URL = "https://otieu.com/4/10153201";

const Index = () => {
  const { shortCode } = useParams();
  const [longUrl, setLongUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownAd, setHasShownAd] = useState(false);

  // Check if this is a redirect URL
  useEffect(() => {
    if (shortCode) {
      handleRedirect(shortCode);
    }
  }, [shortCode]);

  const handleRedirect = async (shortCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('redirect-url', {
        body: { shortCode },
      });

      if (error) throw error;

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error('Redirect error:', error);
      toast.error("Short URL not found");
    }
  };

  const openAdInNewTab = () => {
    window.open(MONETAG_AD_URL, '_blank');
    setHasShownAd(true);
  };

  const generateQRCode = async (url: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#3b82f6',
          light: '#ffffff',
        },
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('QR Code generation error:', error);
    }
  };

  const handleShorten = async () => {
    // Open ad on every submission
    openAdInNewTab();

    if (!longUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Validate URL format
    try {
      new URL(longUrl);
    } catch {
      toast.error("Please enter a valid URL (include http:// or https://)");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('shorten-url', {
        body: {
          originalUrl: longUrl,
          customSlug: customSlug.trim() || null,
        },
      });

      if (error) throw error;

      if (data?.shortUrl) {
        setShortUrl(data.shortUrl);
        await generateQRCode(data.shortUrl);
        toast.success("URL shortened successfully!");
      }
    } catch (error: any) {
      console.error('Shorten error:', error);
      toast.error(error.message || "Failed to shorten URL. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = 'urlbite-qrcode.png';
    link.href = qrCodeUrl;
    link.click();
    toast.success("QR code downloaded!");
  };

  const handleReset = () => {
    setLongUrl("");
    setCustomSlug("");
    setShortUrl("");
    setQrCodeUrl("");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <main className="container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-hero rounded-2xl shadow-button">
              <Scissors className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
            UrlBite.site
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Shorten URLs instantly for free. No signup, no expiry, no tracking.
          </p>
        </header>

        {/* Main Card */}
        <Card className="max-w-3xl mx-auto p-6 md:p-8 shadow-card border-2">
          {!shortUrl ? (
            <div className="space-y-6">
              <div>
                <label htmlFor="longUrl" className="block text-sm font-medium mb-2 text-foreground">
                  Enter your long URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="longUrl"
                    type="url"
                    placeholder="https://example.com/very/long/url/that/needs/shortening"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    className="pl-10 h-12 text-base"
                    onKeyDown={(e) => e.key === 'Enter' && handleShorten()}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="customSlug" className="block text-sm font-medium mb-2 text-foreground">
                  Custom short URL (optional)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">urlbite.site/</span>
                  <Input
                    id="customSlug"
                    type="text"
                    placeholder="my-custom-link"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="h-12 text-base"
                    maxLength={50}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use 3-50 characters: letters, numbers, hyphens, or underscores
                </p>
              </div>

              <Button
                onClick={handleShorten}
                disabled={isLoading}
                size="lg"
                className="w-full h-12 text-base font-semibold bg-gradient-hero shadow-button hover:opacity-90 transition-opacity"
              >
                {isLoading ? "Creating..." : "Create Short URL"}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-secondary rounded-full animate-pulse" />
                  <p className="text-sm font-medium text-secondary">URL Created Successfully!</p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Your shortened URL
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={shortUrl}
                    readOnly
                    className="h-12 text-base font-mono"
                  />
                  <Button
                    onClick={handleCopy}
                    size="lg"
                    variant="secondary"
                    className="shrink-0"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {qrCodeUrl && (
                <div className="text-center space-y-3">
                  <p className="text-sm font-medium text-foreground">QR Code</p>
                  <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
                  </div>
                  <Button
                    onClick={handleDownloadQR}
                    variant="outline"
                    className="w-full"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              )}

              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Create Another URL
              </Button>
            </div>
          )}
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <LinkIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Never Expires</h3>
            <p className="text-sm text-muted-foreground">Your links work forever</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Scissors className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">Custom Links</h3>
            <p className="text-sm text-muted-foreground">Personalize your short URLs</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">QR Codes</h3>
            <p className="text-sm text-muted-foreground">Download QR codes instantly</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground border-t mt-16">
        <p>&copy; 2025 UrlBite.site - Free URL Shortener. No signup required.</p>
      </footer>
    </div>
  );
};

export default Index;