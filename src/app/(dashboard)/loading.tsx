export default function Loading() {
  return (
    <div className="px-6 pt-8 max-w-[1100px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="skeleton w-8 h-8 !rounded-lg" />
        <div className="skeleton h-5 w-28" />
      </div>
      <div className="flex gap-5">
        <div className="skeleton h-52 flex-1" />
        <div className="skeleton h-52 flex-1 hidden md:block" />
        <div className="skeleton h-52 flex-1 hidden lg:block" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="skeleton h-44" />
        <div className="skeleton h-44" />
      </div>
    </div>
  )
}
