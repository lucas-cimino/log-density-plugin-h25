import requests


def improve_logs():
    url = "http://127.0.0.1:8000/improve-logs"  # Adjust host if running elsewhere

    # Example diff and context data
    diff_content = """
diff --git a/MainApplication.java b/MainApplication.java
index 9a01aa5..11801f2 100644
--- a/MainApplication.java
+++ b/MainApplication.java
@@ -9 +9 @@ public class Main {
-            System.out.println("Arguments recei: ");
+            System.out.println("Arguments receie: ");
@@ -14,0 +15 @@ public class Main {
+            System.out.println("No arguments receivedddddd.");
"""

    context_content = """public class Main {

    public static void main(String[] args) {
        // This is the entry point of the application
        System.out.println("Welcome to the Java application!");

        // Example of how to use the application logic
        if (args.length > 0) {
            System.out.println("Arguments recei: ");
            for (String arg : args) {
                System.out.println(arg);
            }
        } else {
            System.out.println("No arguments received.");
        }

        // Example method call to demonstrate further functionality
        int result = addNumbers(5, 10);
        System.out.println("Sum of 5 and 10 is: " + result);
    }

    // Example utility method
    public static int addNumbers(int a, int b) {
        return a + b;
    }
}
"""

    payload = {"diff": diff_content, "context": context_content}

    response = requests.post(url, json=payload)

    print("Status Code:", response.status_code)
    print("Response:", response.json())


# Run the test
if __name__ == "__main__":
    improve_logs()
