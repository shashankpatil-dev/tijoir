import { EmptyState, PageSection } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineMessage, SectionCard } from "@/components/ui/feedback";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type { NotificationSummary } from "@/features/notifications/types/notifications.types";

function deliveryTone(status: NotificationSummary["emailDeliveryStatus"]) {
  switch (status) {
    case "SENT":
      return "success";
    case "FAILED":
      return "warning";
    case "SKIPPED":
      return "info";
    case "NOT_REQUESTED":
    default:
      return "neutral";
  }
}

function titleForType(type: NotificationSummary["type"]) {
  switch (type) {
    case "EMAIL_VERIFICATION":
      return "Verification";
    case "EMAIL_VERIFICATION_RESEND":
      return "Verification resend";
    case "ORGANIZATION_INVITE":
      return "Organization invite";
    default:
      return type;
  }
}

export function NotificationsView({
  busyId,
  error,
  loading,
  notifications,
  onCopyLink,
  onMarkRead,
  onNextPage,
  onPreviousPage,
  page,
  pageCount,
}: {
  busyId: string | null;
  error?: string | null;
  loading: boolean;
  notifications: NotificationSummary[];
  onCopyLink: (value: string, label: string) => Promise<void>;
  onMarkRead: (notificationId: string) => Promise<void>;
  onNextPage: () => void;
  onPreviousPage: () => void;
  page: number;
  pageCount: number;
}) {
  return (
    <div className="space-y-5">
      {error ? (
        <InlineMessage
          body={error}
          title="Notification feed could not be refreshed"
          tone="error"
        />
      ) : null}

      <PageSection title="Inbox">
        {loading && !notifications.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SectionCard
                description="Loading notification details."
                key={index}
                title="Loading"
              >
                <div className="h-16 animate-pulse rounded-xl bg-(--color-surface)" />
              </SectionCard>
            ))}
          </div>
        ) : notifications.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {notifications.map((notification) => {
              const unread = !notification.readAt;
              return (
                <section
                  className="rounded-xl border border-(--color-dashboard-border) bg-white p-4 shadow-(--shadow-card)"
                  key={notification.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">{titleForType(notification.type)}</Badge>
                    <Badge tone={deliveryTone(notification.emailDeliveryStatus)}>
                      {notification.emailDeliveryStatus}
                    </Badge>
                    <Badge tone={unread ? "warning" : "success"}>
                      {unread ? "Unread" : "Read"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    <h2 className="text-base font-semibold text-(--color-ink-strong)">
                      {notification.title}
                    </h2>
                    <p className="text-sm leading-6 text-muted">
                      {notification.message}
                    </p>
                  </div>

                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-(--color-surface) p-3">
                      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                        Recipient
                      </dt>
                      <dd className="mt-1 text-sm text-(--color-ink-strong)">
                        {notification.recipientEmail}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-(--color-surface) p-3">
                      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                        Created
                      </dt>
                      <dd className="mt-1 text-sm text-(--color-ink-strong)">
                        {formatInstant(notification.createdAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {notification.actionUrl ? (
                      <Button
                        onClick={() => void onCopyLink(notification.actionUrl as string, "Notification link")}
                        type="button"
                        variant="secondary"
                      >
                        Copy link
                      </Button>
                    ) : null}
                    {unread ? (
                      <Button
                        disabled={busyId === notification.id}
                        onClick={() => void onMarkRead(notification.id)}
                        type="button"
                        variant="secondary"
                      >
                        {busyId === notification.id ? "Marking..." : "Mark as read"}
                      </Button>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <EmptyState
            description="Verification, invite, and future delivery notifications will appear here."
            title="No notifications yet"
          />
        )}
      </PageSection>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Page {page} of {Math.max(pageCount, 1)}
        </p>
        <div className="flex gap-3">
          <Button
            disabled={page <= 1}
            onClick={onPreviousPage}
            type="button"
            variant="secondary"
          >
            Previous
          </Button>
          <Button
            disabled={page >= pageCount}
            onClick={onNextPage}
            type="button"
            variant="secondary"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
