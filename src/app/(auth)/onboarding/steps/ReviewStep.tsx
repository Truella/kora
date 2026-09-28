import Image from "next/image";
import { COUNTRY_OPTIONS } from "@/constants/countries";
import { COUNTRY_CODES, type CountryKey } from "@/lib/phone";

export function ReviewStep({
  name,
  country,
  avatarPreview,
}: {
  name: string;
  country: CountryKey;
  avatarPreview: string | null;
}) {
  const chosen = COUNTRY_OPTIONS.find((c) => c.key === country);
  return (
    <>
      <dl className="flex flex-col gap-2 rounded-[14px] border-[0.5px] border-border bg-surface p-4">
        {avatarPreview && (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-sm text-text-secondary">Photo</dt>
            <dd>
              <Image
                src={avatarPreview}
                alt="Your profile photo preview"
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 rounded-[10px] object-cover"
              />
            </dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-sm text-text-secondary">Name</dt>
          <dd className="text-sm font-semibold text-text-primary">
            {name.trim()}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <dt className="text-sm text-text-secondary">Home country</dt>
          <dd className="text-sm font-semibold text-text-primary">
            {chosen?.name} (+{chosen && COUNTRY_CODES[chosen.key]})
          </dd>
        </div>
      </dl>
      <p className="text-xs leading-5 text-text-secondary">
        Looks right? Circle members will recognize you by this name.
      </p>
    </>
  );
}
