import { format } from "date-fns";
import { 
  ArrowRight, Bot, User, CheckCircle2, XCircle, 
  Zap, Info, Clock
} from "lucide-react";
import { cn } from "../../lib/utils";

// Components for different event types
function TransitionEvent({ data }) {
  const isApi = data.actor === 'api';
  const Icon = isApi ? User : Bot;
  const isError = data.to_status === 'failed';
  
  return (
    <div className="group relative bg-white dark:bg-[#1c1d25] border border-gray-100 dark:border-[#2e303a] p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-purple-200 dark:hover:border-purple-900/50">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500 pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md bg-gray-100 dark:bg-[#2e303a] text-gray-600 dark:text-gray-300 lowercase">
              <Icon className="w-3.5 h-3.5" />
              {data.actor || "system"}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">State Transition</span>
          </div>
          
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className={cn(
              "px-3 py-1 rounded-full border border-gray-200 dark:border-[#2e303a] capitalize",
              !data.from_status ? "text-gray-400 border-dashed" : "text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-[#23242d]"
            )}>
              {data.from_status || 'none'}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400 animate-pulse shrink-0" />
            <span className={cn(
              "px-3 py-1 rounded-full border capitalize",
              isError ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400" :
              data.to_status === 'completed' ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400" :
              "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/30 dark:bg-purple-900/10 dark:text-purple-400"
            )}>
              {data.to_status}
            </span>
          </div>
        </div>

        {data.reason && (
          <div className="flex items-start gap-2 bg-gray-50 dark:bg-[#23242d] px-3 py-2 rounded-lg max-w-[280px]">
             <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
             <p className="text-xs text-gray-600 dark:text-gray-300 font-mono break-all">{data.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineItem({ event, isLast }) {
  let Icon = Zap;
  let iconBg = "bg-gray-100 dark:bg-gray-800 text-gray-500";
  let ringColor = "ring-white dark:ring-[#16171d]";

  const isError = event.data.to_status === 'failed';
  const isSuccess = event.data.to_status === 'completed';
  Icon = isError ? XCircle : (isSuccess ? CheckCircle2 : ArrowRight);
  iconBg = isError ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : 
          (isSuccess ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400");

  return (
    <div className="relative pl-12 sm:pl-36 py-4 group">
      {/* Timestamp (Desktop) */}
      <div className="hidden sm:block absolute left-0 top-6 w-24 text-right">
        <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
          {format(new Date(event.timestamp), "HH:mm:ss")}
        </div>
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
          {format(new Date(event.timestamp), "MMM d")}
        </div>
      </div>

      {/* Timeline Line & Icon */}
      <div className="absolute left-2 sm:left-28 flex flex-col items-center w-8 top-0 bottom-0">
        <div className="w-px h-6 bg-gray-200 dark:bg-[#2e303a]" />
        <div className={cn(
          "w-8 h-8 shrink-0 rounded-full flex items-center justify-center ring-4 z-10 transition-transform duration-300 group-hover:scale-110 shadow-sm",
          iconBg, ringColor
        )}>
          <Icon className="w-4 h-4" />
        </div>
        {!isLast && <div className="w-px flex-1 bg-gray-200 dark:bg-[#2e303a]" />}
        {isLast && <div className="w-px flex-1 bg-gradient-to-b from-gray-200 dark:from-[#2e303a] to-transparent" />}
      </div>

      {/* Timestamp Mobile */}
      <div className="sm:hidden mb-2 text-xs text-gray-500 font-medium ml-1">
        {format(new Date(event.timestamp), "MMM d, yyyy • HH:mm:ss")}
      </div>

      {/* Content */}
      <div className="pr-2 sm:pr-4">
        <TransitionEvent data={event.data} />
      </div>
    </div>
  );
}

export function PayoutTimeline({ transitions = [] }) {
  const events = [];
  
  transitions.forEach(t => {
    events.push({
      type: 'transition',
      id: `trans-${t.id}`,
      timestamp: new Date(t.created_at).getTime(),
      data: t,
    });
  });
  
  events.sort((a, b) => a.timestamp - b.timestamp);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 dark:bg-[#1c1d25] rounded-2xl border border-dashed border-gray-200 dark:border-[#2e303a]">
        <Clock className="w-10 h-10 mb-3 text-gray-400" />
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No execution history available yet.</p>
      </div>
    );
  }

  return (
    <div className="relative py-2 max-w-4xl mx-auto overflow-hidden">
      {events.map((event, idx) => (
         <TimelineItem key={event.id} event={event} isLast={idx === events.length - 1} />
      ))}
    </div>
  );
}
