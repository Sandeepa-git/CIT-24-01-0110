
# Checkpoint Answers - Kubernetes Fundamentals Lab

### Checkpoint Q1. In your own words, explain the difference between the control plane and a worker node.

* **Control Plane**: It acts as the brain/orchestrator of the cluster. It monitors the cluster status, schedules workloads (Pods) onto nodes, controls how workloads behave, and holds the state of the cluster.
* **Worker Node**: These are the compute instances (VMs or physical servers) that run the actual containerized applications. They contain components like kubelet, kube-proxy, and the container runtime to execute the instructions received from the control plane.

---

### Checkpoint Q2. Delete the pod (`kubectl delete pod frontend`), then recreate it from the same manifest and check its IP with `kubectl get pods -o wide`. Has the IP changed? Explain why, using the lecture's description of Pods as "ephemeral."

* Yes, the IP address changed.
* Kubernetes Pods are **ephemeral** (cattle, not pets) meaning they have a temporary lifespan. When a pod is deleted, it is gone forever. Re-creating a pod from the same manifest triggers a new creation cycle, which spins up a brand-new network container and assigns it a new IP address from the pool.

---

### Checkpoint Q3. Using the lecture's control-loop model — Desired State → Controller watches → Actual State → Gap Detected → Reconcile — describe, step by step, exactly what Kubernetes did when you deleted the pod.

1. **Desired State**: The Deployment controller tracks the manifest stating that `replicas: 3` is required.
2. **Actual State**: You deleted a pod, reducing the count of active Pods to 2.
3. **Controller Watches**: The ReplicaSet Controller continuously polls the cluster API server for resource states.
4. **Gap Detected**: The Controller notices that the actual state (2 pods) does not match the desired state (3 pods).
5. **Reconcile**: The ReplicaSet Controller triggers the creation of a new Pod. The Scheduler schedules it onto a node, the Kubelet downloads the image, starts the container, and restores the actual running count to 3.

---

### Checkpoint Q4. The lecture's "Applications Are Multiple Containers" slide states that each service can scale independently. Once you deploy the database tier in Part 7, why will you be able to scale the frontend without touching it?

* The frontend tier and the database tier are completely isolated Deployments/StatefulSets.
* They communicate via abstraction layers (Kubernetes Services). The frontend connects to the database using the stable DNS domain/IP of `postgres-service`. Scaling the frontend up or down only changes the replica count of the frontend web containers and does not affect the database deployment configuration or data storage.

---

### Checkpoint Q5. What is the difference between accessing a Pod directly via port-forward (Part 2) and accessing it through a Service (Part 5)? Why do Services matter, given that Pods are ephemeral and get new IPs when replaced?

* **Port-Forward**: Establishes a direct, single-point proxy tunnel from your local machine to one specific Pod instance. If the Pod crashes or changes IP, the port-forward fails and must be re-run.
* **Service**: Exposes a stable network abstraction layer. The Service has a static virtual IP and DNS name that routes traffic across a pool of dynamic frontend Pods using selectors.
* **Why they matter**: Because Pods are ephemeral and receive unpredictable IPs on recreation, a Service acts as a load-balancer that provides a single, permanent entry point to route traffic to whichever Pod is currently active.

---

### Checkpoint Q6. Referring to the lecture's list of things "Docker Compose Cannot" do, explain why this same update-and-rollback would be much harder to do safely with Docker Compose alone.

* Docker Compose lacks built-in support for **Rolling Updates** (where containers are updated one-by-one with zero downtime). Usually, Docker Compose recreates the containers in-place, causing a window of downtime.
* Furthermore, Docker Compose cannot perform automated **Rollbacks** if the updated container fails. It has no controller loops monitoring the health of a new version to automatically revert to the previous working configuration.

---

### Checkpoint Q7. Explain why the frontend and API tiers use a Deployment while the database tier uses a StatefulSet. Refer to the lecture's Stateless vs Stateful comparison (pod naming, storage, ordering).

* **Deployments (Frontend / API)**: Best for *stateless* workloads. The Pods have no local persistent state, meaning they can be created or destroyed randomly. Pod names are generated with random strings (e.g. `frontend-xyz12`), start in any order, and share no sticky storage.
* **StatefulSet (Database)**: Best for *stateful* workloads. The database requires:
  - **Stable Naming**: Pods are named sequentially starting from 0 (`postgres-0`).
  - **Stable persistent storage**: Each pod index is mapped to a specific PersistentVolumeClaim (PVC). If `postgres-0` dies and is recreated, the controller ensures it re-binds to the exact same PersistentVolume, maintaining data integrity.
  - **Ordered startup/shutdown**: Replicas are started sequentially (e.g., 0, then 1, then 2) and terminated in reverse order, which is essential for database clustering/master-slave coordination.

---

### Checkpoint Q8. Would this data have survived if postgres had instead been deployed as a plain Deployment without a PersistentVolumeClaim? Explain your reasoning.

* No, the data would not have survived.
* In a Deployment without a PVC, data written by PostgreSQL would be stored in the transient container filesystem. When a Pod is deleted, the container is destroyed, along with its writable container layer, wiping out all files written inside.

---

### Checkpoint Q9. What status did the broken pod show? Compare it against the lecture's Pod Status table (Running / Pending / CrashLoopBackOff / OOMKilled) — does it match one of these exactly, or is it a related status not explicitly listed? Explain what it means.

* The broken pod showed a status of **`ImagePullBackOff`** or **`ErrImagePull`**.
* This is a related sub-status occurring under the general **Pending** phase.
* It means the Kubelet was unable to retrieve the container image from the registry (Docker Hub) because the specified tag does not exist. It backs off (`BackOff`) and retries pulling, waiting between retries.
