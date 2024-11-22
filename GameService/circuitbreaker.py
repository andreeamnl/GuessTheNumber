import time
import logging
import requests
import os

# Configuration Constants
TASK_TIMEOUT_LIMIT = 5000  # Task timeout in milliseconds
RETRY_WINDOW = 3.5 * TASK_TIMEOUT_LIMIT  # Retry window in milliseconds (3.5 times timeout)
FAILURE_THRESHOLD = 3  # Number of allowed failures within the retry window
COOLDOWN_PERIOD = 10  # Cooldown period in seconds before resetting the circuit

# CircuitBreaker class
class CircuitBreaker:
    def __init__(self, timeout_limit, retry_window, failure_threshold, cooldown_period):
        self.timeout_limit = timeout_limit
        self.retry_window = retry_window
        self.failure_threshold = failure_threshold
        self.cooldown_period = cooldown_period
        self.failures = 0
        self.last_failure_time = None
        self.circuit_open = False
        self.failure_times = []  # To track the times of failures within the retry window

    def trip(self, service_name):
        """Logs and trips the circuit breaker if the failure threshold is reached."""
        self.failures += 1
        current_time = time.time()
        self.failure_times.append(current_time)

        # Remove failures outside the retry window
        self.failure_times = [ft for ft in self.failure_times if current_time - ft <= self.retry_window]

        if len(self.failure_times) >= self.failure_threshold:
            self.circuit_open = True
            logging.error(f"Service {service_name} has failed {self.failures} times within the retry window. Circuit breaker tripped.")

    def reset(self):
        """Resets the circuit breaker after the cooldown period."""
        self.failures = 0
        self.failure_times = []
        self.circuit_open = False
        logging.info("Circuit breaker reset. Ready to make calls again.")

    def is_open(self):
        """Checks if the circuit is open (i.e., if it should stop making calls)."""
        if self.circuit_open:
            if time.time() - self.failure_times[0] >= self.cooldown_period:
                self.reset()
            else:
                return True
        return False

    def call_service(self, service_name, service_url):
        """Makes the service call and handles failure and retries."""
        if self.is_open():
            logging.warning(f"Circuit breaker is open for service {service_name}. Skipping service call.")
            return None

        try:
            # Try to make the service call
            response = requests.get(service_url, timeout=self.timeout_limit / 1000)  # Convert timeout to seconds
            if response.status_code == 200:
                logging.info(f"Service {service_name} call successful.")
                return response
            else:
                logging.error(f"Service {service_name} responded with {response.status_code}.")
                self.trip(service_name)
                return None
        except requests.exceptions.RequestException as e:
            logging.error(f"Service {service_name} failed due to error: {e}")
            self.trip(service_name)
            return None

# Example usage
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Retrieve service name and URL from environment variables
    service_name = os.getenv('SERVICE_NAME', 'game-service')  # Default to 'game-service'
    service_port = os.getenv('SERVICE_PORT', '8080')  # Default to '8080'
    service_url = f"http://{service_name}:{service_port}/status"  # Construct URL

    # Initialize the CircuitBreaker with parameters
    breaker = CircuitBreaker(TASK_TIMEOUT_LIMIT, RETRY_WINDOW, FAILURE_THRESHOLD, COOLDOWN_PERIOD)

    # Simulating service calls
    for _ in range(5):
        breaker.call_service(service_name, service_url)
        time.sleep(2)  # Simulating time between service calls
