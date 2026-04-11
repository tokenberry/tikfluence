"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Creator-side default shipping address (F3).
 *
 * Persisted to `CreatorShippingAddress` via `/api/creators/me/shipping-address`.
 * Used as the pre-fill source when the creator confirms an address on an
 * order that requires physical product shipment. Editing the address here
 * does NOT rewrite history on past shipments — each OrderAssignment carries
 * its own snapshot from the moment the creator confirmed it.
 */
export function CreatorShippingAddressForm() {
  const t = useTranslations("shipping");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/creators/me/shipping-address", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        const a = data?.address;
        if (a) {
          setFullName(a.fullName ?? "");
          setLine1(a.line1 ?? "");
          setLine2(a.line2 ?? "");
          setCity(a.city ?? "");
          setStateRegion(a.state ?? "");
          setPostalCode(a.postalCode ?? "");
          setCountry(a.country ?? "");
          setPhone(a.phone ?? "");
        }
      } catch {
        // ignored
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !fullName.trim() ||
      !line1.trim() ||
      !city.trim() ||
      !postalCode.trim() ||
      !country.trim()
    ) {
      toast.error(t("fill_required_fields"));
      return;
    }
    if (!/^[A-Za-z]{2}$/.test(country.trim())) {
      toast.error(t("country_must_be_iso2"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/creators/me/shipping-address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          line1: line1.trim(),
          line2: line2.trim() || null,
          city: city.trim(),
          state: stateRegion.trim() || null,
          postalCode: postalCode.trim(),
          country: country.trim().toUpperCase(),
          phone: phone.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success(t("default_address_saved_toast"));
      } else {
        toast.error(t("default_address_save_failed"));
      }
    } catch {
      toast.error(t("default_address_save_failed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
        {t("loading")}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <Home className="h-5 w-5 text-[#d4772c]" />
        <h2 className="text-lg font-semibold text-gray-900">
          {t("default_address_title")}
        </h2>
      </div>
      <p className="mb-4 text-xs text-gray-500">
        {t("default_address_subtitle")}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="default-ship-name">{t("field_full_name")}</Label>
          <Input
            id="default-ship-name"
            value={fullName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFullName(e.target.value)
            }
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="default-ship-line1">{t("field_line1")}</Label>
          <Input
            id="default-ship-line1"
            value={line1}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setLine1(e.target.value)
            }
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="default-ship-line2">{t("field_line2")}</Label>
          <Input
            id="default-ship-line2"
            value={line2}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setLine2(e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="default-ship-city">{t("field_city")}</Label>
          <Input
            id="default-ship-city"
            value={city}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setCity(e.target.value)
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="default-ship-state">{t("field_state")}</Label>
          <Input
            id="default-ship-state"
            value={stateRegion}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setStateRegion(e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="default-ship-postal">{t("field_postal")}</Label>
          <Input
            id="default-ship-postal"
            value={postalCode}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPostalCode(e.target.value)
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="default-ship-country">{t("field_country")}</Label>
          <Input
            id="default-ship-country"
            value={country}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setCountry(e.target.value)
            }
            maxLength={2}
            placeholder="US"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="default-ship-phone">{t("field_phone")}</Label>
          <Input
            id="default-ship-phone"
            value={phone}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPhone(e.target.value)
            }
          />
        </div>
      </div>

      <div className="mt-4">
        <Button type="submit" disabled={saving}>
          {saving ? t("saving") : t("save_default_address")}
        </Button>
      </div>
    </form>
  );
}
