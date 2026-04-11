"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CheckCircle2,
  Home,
  Package,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ShippingStatus =
  | "NOT_REQUIRED"
  | "PENDING_ADDRESS"
  | "PENDING_SHIPMENT"
  | "SHIPPED"
  | "DELIVERED"
  | "ISSUE_REPORTED";

interface ShippingState {
  orderId: string;
  assignmentId: string;
  requiresShipping: boolean;
  shippingStatus: ShippingStatus;
  shipAddressName: string | null;
  shipAddressLine1: string | null;
  shipAddressLine2: string | null;
  shipAddressCity: string | null;
  shipAddressState: string | null;
  shipAddressPostal: string | null;
  shipAddressCountry: string | null;
  shipAddressPhone: string | null;
  shippingCarrier: string | null;
  shippingTracking: string | null;
  shippingTrackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  shippingNotes: string | null;
  shippingIssue: string | null;
}

interface SavedAddress {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
}

export interface ShippingPanelProps {
  orderId: string;
  assignmentId: string;
  /** "receiver" = creator/network; "manager" = brand/agency/AM/admin. */
  mode: "receiver" | "manager";
  /** What the brand said they will ship. */
  productDescription?: string | null;
  productValue?: number | null;
}

export function ShippingPanel({
  orderId,
  assignmentId,
  mode,
  productDescription,
  productValue,
}: ShippingPanelProps) {
  const t = useTranslations("shipping");
  const [state, setState] = useState<ShippingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const apiBase = `/api/orders/${orderId}/assignments/${assignmentId}/shipping`;

  const reload = useCallback(async () => {
    try {
      const res = await fetch(apiBase, { cache: "no-store" });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data: ShippingState = await res.json();
      setState(data);
    } catch {
      // ignored — the surface just stays empty
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    reload();
  }, [reload]);

  const runAction = async (body: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error ?? t("action_failed"));
        return false;
      }
      await reload();
      return true;
    } catch {
      toast.error(t("action_failed"));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <div className="text-sm text-neutral-500">{t("loading")}</div>
      </div>
    );
  }

  if (!state || !state.requiresShipping) {
    return null;
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-[#d4772c]" />
            <h3 className="text-lg font-semibold text-neutral-900">
              {t("title")}
            </h3>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {mode === "receiver" ? t("subtitle_receiver") : t("subtitle_manager")}
          </p>
        </div>
        <StatusBadge status={state.shippingStatus} t={t} />
      </div>

      {(productDescription || productValue != null) && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-start gap-2">
            <Package className="mt-0.5 h-4 w-4 text-neutral-500" />
            <div className="flex-1 text-sm">
              {productDescription && (
                <div className="font-medium text-neutral-900">
                  {productDescription}
                </div>
              )}
              {productValue != null && (
                <div className="text-xs text-neutral-500">
                  {t("declared_value")}: ${productValue.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {state.shippingStatus === "PENDING_ADDRESS" && (
        <AddressSection
          mode={mode}
          onSubmit={(payload) =>
            runAction({ action: "set_address", ...payload })
          }
          submitting={submitting}
          t={t}
        />
      )}

      {state.shippingStatus === "PENDING_SHIPMENT" && (
        <>
          <AddressSnapshot state={state} t={t} />
          {mode === "manager" ? (
            <MarkShippedSection
              onSubmit={(payload) =>
                runAction({ action: "mark_shipped", ...payload })
              }
              submitting={submitting}
              t={t}
            />
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {t("waiting_for_brand_to_ship")}
            </div>
          )}
          {mode === "receiver" && (
            <ReportIssueSection
              onSubmit={(issue) => runAction({ action: "report_issue", issue })}
              submitting={submitting}
              t={t}
            />
          )}
        </>
      )}

      {state.shippingStatus === "SHIPPED" && (
        <>
          <AddressSnapshot state={state} t={t} />
          <TrackingSnapshot state={state} t={t} />
          {mode === "receiver" ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={submitting}
                  onClick={() =>
                    runAction({ action: "confirm_delivery" }).then((ok) => {
                      if (ok) toast.success(t("delivery_confirmed_toast"));
                    })
                  }
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  {t("confirm_delivery")}
                </Button>
              </div>
              <ReportIssueSection
                onSubmit={(issue) =>
                  runAction({ action: "report_issue", issue })
                }
                submitting={submitting}
                t={t}
              />
            </>
          ) : (
            <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
              {t("waiting_for_creator_confirm")}
            </div>
          )}
        </>
      )}

      {state.shippingStatus === "DELIVERED" && (
        <>
          <AddressSnapshot state={state} t={t} />
          <TrackingSnapshot state={state} t={t} />
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              <div className="text-sm text-emerald-900">
                <div className="font-medium">{t("delivered_banner_title")}</div>
                {state.deliveredAt && (
                  <div className="text-xs text-emerald-700">
                    {new Date(state.deliveredAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {state.shippingStatus === "ISSUE_REPORTED" && (
        <>
          <AddressSnapshot state={state} t={t} />
          {state.shippingTracking && <TrackingSnapshot state={state} t={t} />}
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
              <div className="text-sm text-red-900">
                <div className="font-medium">{t("issue_banner_title")}</div>
                {state.shippingIssue && (
                  <div className="mt-1 whitespace-pre-wrap text-red-800">
                    {state.shippingIssue}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  t,
}: {
  status: ShippingStatus;
  t: (k: string) => string;
}) {
  const map: Record<
    ShippingStatus,
    { label: string; className: string }
  > = {
    NOT_REQUIRED: {
      label: t("status_not_required"),
      className: "bg-neutral-100 text-neutral-600",
    },
    PENDING_ADDRESS: {
      label: t("status_pending_address"),
      className: "bg-amber-100 text-amber-800",
    },
    PENDING_SHIPMENT: {
      label: t("status_pending_shipment"),
      className: "bg-amber-100 text-amber-800",
    },
    SHIPPED: {
      label: t("status_shipped"),
      className: "bg-sky-100 text-sky-800",
    },
    DELIVERED: {
      label: t("status_delivered"),
      className: "bg-emerald-100 text-emerald-800",
    },
    ISSUE_REPORTED: {
      label: t("status_issue"),
      className: "bg-red-100 text-red-800",
    },
  };
  const entry = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${entry.className}`}
    >
      {entry.label}
    </span>
  );
}

function AddressSnapshot({
  state,
  t,
}: {
  state: ShippingState;
  t: (k: string) => string;
}) {
  if (!state.shipAddressLine1) return null;
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-start gap-2">
        <Home className="mt-0.5 h-4 w-4 text-neutral-500" />
        <div className="flex-1 text-sm text-neutral-800">
          <div className="font-medium">{state.shipAddressName}</div>
          <div>{state.shipAddressLine1}</div>
          {state.shipAddressLine2 && <div>{state.shipAddressLine2}</div>}
          <div>
            {[state.shipAddressCity, state.shipAddressState]
              .filter(Boolean)
              .join(", ")}{" "}
            {state.shipAddressPostal}
          </div>
          <div>{state.shipAddressCountry}</div>
          {state.shipAddressPhone && (
            <div className="text-xs text-neutral-500">
              {state.shipAddressPhone}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 text-xs text-neutral-400">
        {t("address_snapshot_note")}
      </div>
    </div>
  );
}

function TrackingSnapshot({
  state,
  t,
}: {
  state: ShippingState;
  t: (k: string) => string;
}) {
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-start gap-2">
        <Truck className="mt-0.5 h-4 w-4 text-neutral-500" />
        <div className="flex-1 text-sm text-neutral-800">
          <div>
            <span className="font-medium">{state.shippingCarrier}</span>{" "}
            <span className="text-neutral-500">
              #{state.shippingTracking}
            </span>
          </div>
          {state.shippingTrackingUrl && (
            <a
              href={state.shippingTrackingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#d4772c] hover:underline"
            >
              {t("open_tracking_page")}
            </a>
          )}
          {state.shippedAt && (
            <div className="text-xs text-neutral-500">
              {t("shipped_at")}: {new Date(state.shippedAt).toLocaleString()}
            </div>
          )}
          {state.shippingNotes && (
            <div className="mt-1 text-xs text-neutral-600">
              {state.shippingNotes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-sections ────────────────────────────────────────────────────────

function AddressSection({
  mode,
  onSubmit,
  submitting,
  t,
}: {
  mode: "receiver" | "manager";
  onSubmit: (payload: SavedAddress) => Promise<boolean>;
  submitting: boolean;
  t: (k: string) => string;
}) {
  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  // Creators: try to pre-fill from their saved default address.
  useEffect(() => {
    if (mode !== "receiver" || prefilled) return;
    (async () => {
      try {
        const res = await fetch("/api/creators/me/shipping-address", {
          cache: "no-store",
        });
        if (!res.ok) {
          setPrefilled(true);
          return;
        }
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
        // ignored — user will just fill the form manually
      } finally {
        setPrefilled(true);
      }
    })();
  }, [mode, prefilled]);

  if (mode !== "receiver") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        {t("waiting_for_creator_address")}
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !line1.trim() || !city.trim() || !postalCode.trim() || !country.trim()) {
      toast.error(t("fill_required_fields"));
      return;
    }
    if (!/^[A-Za-z]{2}$/.test(country.trim())) {
      toast.error(t("country_must_be_iso2"));
      return;
    }
    const ok = await onSubmit({
      fullName: fullName.trim(),
      line1: line1.trim(),
      line2: line2.trim() || null,
      city: city.trim(),
      state: stateRegion.trim() || null,
      postalCode: postalCode.trim(),
      country: country.trim().toUpperCase(),
      phone: phone.trim() || null,
    });
    if (ok) toast.success(t("address_saved_toast"));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="ship-name">{t("field_full_name")}</Label>
          <Input
            id="ship-name"
            value={fullName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFullName(e.target.value)
            }
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ship-line1">{t("field_line1")}</Label>
          <Input
            id="ship-line1"
            value={line1}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setLine1(e.target.value)
            }
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ship-line2">{t("field_line2")}</Label>
          <Input
            id="ship-line2"
            value={line2}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setLine2(e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="ship-city">{t("field_city")}</Label>
          <Input
            id="ship-city"
            value={city}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setCity(e.target.value)
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="ship-state">{t("field_state")}</Label>
          <Input
            id="ship-state"
            value={stateRegion}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setStateRegion(e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="ship-postal">{t("field_postal")}</Label>
          <Input
            id="ship-postal"
            value={postalCode}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPostalCode(e.target.value)
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="ship-country">{t("field_country")}</Label>
          <Input
            id="ship-country"
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
          <Label htmlFor="ship-phone">{t("field_phone")}</Label>
          <Input
            id="ship-phone"
            value={phone}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPhone(e.target.value)
            }
          />
        </div>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? t("saving") : t("confirm_address")}
      </Button>
    </form>
  );
}

function MarkShippedSection({
  onSubmit,
  submitting,
  t,
}: {
  onSubmit: (payload: {
    carrier: string;
    tracking: string;
    trackingUrl: string | null;
    notes: string | null;
  }) => Promise<boolean>;
  submitting: boolean;
  t: (k: string) => string;
}) {
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!carrier.trim() || !tracking.trim()) {
      toast.error(t("fill_required_fields"));
      return;
    }
    const ok = await onSubmit({
      carrier: carrier.trim(),
      tracking: tracking.trim(),
      trackingUrl: trackingUrl.trim() || null,
      notes: notes.trim() || null,
    });
    if (ok) toast.success(t("shipped_toast"));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="ship-carrier">{t("field_carrier")}</Label>
          <Select value={carrier} onValueChange={setCarrier}>
            <SelectTrigger id="ship-carrier">
              <SelectValue placeholder={t("field_carrier_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USPS">USPS</SelectItem>
              <SelectItem value="UPS">UPS</SelectItem>
              <SelectItem value="FedEx">FedEx</SelectItem>
              <SelectItem value="DHL">DHL</SelectItem>
              <SelectItem value="Other">{t("carrier_other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="ship-tracking">{t("field_tracking")}</Label>
          <Input
            id="ship-tracking"
            value={tracking}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTracking(e.target.value)
            }
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ship-tracking-url">{t("field_tracking_url")}</Label>
          <Input
            id="ship-tracking-url"
            type="url"
            value={trackingUrl}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTrackingUrl(e.target.value)
            }
            placeholder="https://"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ship-notes">{t("field_notes")}</Label>
          <Textarea
            id="ship-notes"
            value={notes}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setNotes(e.target.value)
            }
            maxLength={2000}
            rows={2}
          />
        </div>
      </div>
      <Button type="submit" disabled={submitting}>
        <Truck className="mr-1 h-4 w-4" />
        {submitting ? t("saving") : t("mark_shipped")}
      </Button>
    </form>
  );
}

function ReportIssueSection({
  onSubmit,
  submitting,
  t,
}: {
  onSubmit: (issue: string) => Promise<boolean>;
  submitting: boolean;
  t: (k: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState("");

  if (!open) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-red-600 hover:underline"
        >
          {t("report_issue_link")}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!issue.trim()) {
          toast.error(t("issue_required"));
          return;
        }
        const ok = await onSubmit(issue.trim());
        if (ok) {
          setOpen(false);
          setIssue("");
          toast.success(t("issue_reported_toast"));
        }
      }}
      className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3"
    >
      <Label htmlFor="ship-issue" className="text-red-900">
        {t("issue_label")}
      </Label>
      <Textarea
        id="ship-issue"
        value={issue}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          setIssue(e.target.value)
        }
        maxLength={2000}
        rows={3}
        placeholder={t("issue_placeholder")}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={submitting}
        >
          {t("report_issue_button")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(false)}
        >
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
