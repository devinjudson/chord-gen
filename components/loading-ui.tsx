export default function LoadingUI() {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] w-full">
      <div className="relative">
        <h1 className="text-4xl font-bold text-center mb-0 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 animate-pulse">
          ChordGen
        </h1>
        <p className="text-sm text-muted-foreground text-center max-w-md mt-2">Loading music generator...</p>
      </div>
      <div className="mt-8 relative w-64 h-2 bg-muted rounded-full overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-primary animate-[loading_1.5s_ease-in-out_infinite]"></div>
      </div>
    </div>
  )
}
