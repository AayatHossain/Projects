erDiagram
    USER ||--o{ BOOKING : places
    SERVICE_TYPE ||--o{ TRIP : categorizes
    OPERATOR ||--o{ TRIP : manages
    STATION ||--o{ TRIP : "is origin of"
    STATION ||--o{ TRIP : "is destination of"
    
    TRIP ||--o{ SEAT : contains
    TRIP ||--|| BUS_DETAILS : "specializes to"
    TRIP ||--|| FLIGHT_DETAILS : "specializes to"
    TRIP ||--|| TRAIN_DETAILS : "specializes to"
    
    BOOKING ||--|{ BOOKING_ITEM : includes
    SEAT ||--o{ BOOKING_ITEM : "is reserved in"
    BOOKING ||--|| PAYMENT : generates

    BOOKING_ITEM ||--|| TICKET : "is issued as"
    USER ||--o{ USER_SESSION : "starts"

    %% --- THE ADMIN ENTITY & GLOBAL MANAGEMENT ---
    ADMIN ||--o{ USER : "manages accounts"
    ADMIN ||--o{ TRIP : "manages schedules"
    ADMIN ||--o{ BOOKING : "manages overrides"
    ADMIN ||--o{ OPERATOR : "manages partnerships"
    ADMIN ||--o{ STATION : "manages locations"
    ADMIN ||--o{ PAYMENT : "handles refunds"

    ADMIN {
        int admin_id PK
        string username UK
        string password_hash
        string access_level "SuperAdmin, Support, Auditor"
        datetime last_login
    }

    USER {
        int user_id PK
        string phone_number UK
        string name
        string email UK
        string password_hash
        boolean is_verified
        datetime created_at
    }

    USER_SESSION {
        int session_id PK
        int user_id FK
        string session_token UK
        datetime login_time
        datetime expiry_time
        string device_info
    }

    SERVICE_TYPE {
        int type_id PK
        string type_name
    }

    OPERATOR {
        int operator_id PK
        string operator_name
        string contact_info
    }

    STATION {
        int station_id PK
        string station_name
        string location_code
    }

    TRIP {
        int trip_id PK
        int type_id FK
        int operator_id FK
        int origin_id FK
        int destination_id FK
        datetime departure
        datetime arrival
        decimal base_fare
    }

    BUS_DETAILS {
        int trip_id PK, FK
        string coach_type
        string seat_layout
    }

    FLIGHT_DETAILS {
        int trip_id PK, FK
        string flight_no
        string aircraft_type
        string travel_class
    }

    TRAIN_DETAILS {
        int trip_id PK, FK
        string train_number
        string coach_class
    }

    SEAT {
        int seat_id PK
        int trip_id FK
        string seat_number
        boolean is_available
    }

    BOOKING {
        int booking_id PK
        int user_id FK
        int trip_id FK
        decimal total_amount
        string status
        datetime created_at
    }

    BOOKING_ITEM {
        int item_id PK
        int booking_id FK
        int seat_id FK
    }

    TICKET {
        int ticket_id PK
        int item_id FK
        string ticket_number UK
        datetime issued_at
        string validation_code
    }

    PAYMENT {
        int payment_id PK
        int booking_id FK
        string gateway
        string transaction_id UK
        string status
    } 