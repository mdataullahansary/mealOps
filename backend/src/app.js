import express from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';

const app = express();

app.use (
    cors ({
        origin : process.env.CORS_ORIGIN,
    credentials: true   })
) 

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


//import routes
import healthCheckRouter from "./routes/healthCheck.route.js";
import authRouter from "./routes/auth.routes.js";
import adminRouter from "./routes/admin.route.js";
import memberRouter from "./routes/member.routes.js"
import mealsRouter from "./routes/meal.routes.js"
import expansesRouter from "./routes/meal.routes.js"
import monthlyRouter from "./routes/monthly.routes.js"
import billsRouter from "./routes/bills.route.js"
import paymentRouter from "./routes/payment.routes.js"
console.log('auth route imported');
console.log('admin route imported');

//routes
app.use("/api/v1/healthCheck", healthCheckRouter)
app.use("/api/v1/auth", authRouter)
app.use("/api/v1/admin", adminRouter)
app.use("/api/v1/member", memberRouter)
app.use("/api/v1/meals", mealsRouter)
app.use("/api/v1/expanses",expansesRouter)
app.use("/api/v1/summary",monthlyRouter)
app.use("/api/v1/bills", billsRouter)
app.use("/api/v1/payment",paymentRouter)



app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const responsePayload = {
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
  };

  if (process.env.NODE_ENV !== 'production') {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
});

console.log("Route registered")

export {app};