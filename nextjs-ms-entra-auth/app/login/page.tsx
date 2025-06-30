import LoginButton from "@/app/components/LoginButton";

function Login() {
  return (
    <div className="flex items-center justify-center min-h-[90vh]">
      <div className="p-5 border rounded-md max-w-[50%] flex gap-5 flex-col">
        <h1 className="text-center font-semibold text-xl">Login</h1>
        
        <LoginButton />
      </div>
    </div>
  );
}

export default Login;
